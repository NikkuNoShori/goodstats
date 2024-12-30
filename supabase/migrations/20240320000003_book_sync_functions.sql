-- Create book_sync_sessions table first
create table if not exists book_sync_sessions (
  sync_id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  total_books integer default 0,
  processed_books integer default 0,
  current_page integer default 0,
  total_pages integer default 0,
  status text default 'initializing'
);

-- Set up RLS
alter table book_sync_sessions enable row level security;

create policy "Users can view own sync sessions"
  on book_sync_sessions for select
  using ( auth.uid() = user_id );

create policy "Users can insert own sync sessions"
  on book_sync_sessions for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own sync sessions"
  on book_sync_sessions for update
  using ( auth.uid() = user_id );

-- Add indexes for performance
create index book_sync_sessions_user_id_idx on book_sync_sessions(user_id);
create index book_sync_sessions_completed_at_idx on book_sync_sessions(completed_at);
create index book_sync_sessions_status_idx on book_sync_sessions(status);

-- Function to cleanup old sync sessions
create or replace function cleanup_old_sync_sessions()
returns void as $$
begin
  -- Delete completed sessions older than 7 days
  delete from book_sync_sessions
  where completed_at < now() - interval '7 days';
  
  -- Delete stale incomplete sessions (older than 1 hour)
  delete from book_sync_sessions
  where completed_at is null 
  and started_at < now() - interval '1 hour';
end;
$$ language plpgsql security definer;

-- Note: To enable automatic cleanup, run the following in the Supabase dashboard:
-- 1. Enable pg_cron extension
-- 2. Run: 
-- select cron.schedule(
--   'cleanup-sync-sessions',
--   '0 0 * * *',
--   $$select cleanup_old_sync_sessions();$$
-- );

-- Function to upsert a book
create or replace function sync_book(
  p_user_id uuid,
  p_goodreads_id text,
  p_title text,
  p_author text,
  p_isbn text default null,
  p_isbn13 text default null,
  p_rating smallint default null,
  p_date_read timestamp with time zone default null,
  p_date_started timestamp with time zone default null,
  p_shelves text[] default null,
  p_page_count integer default null,
  p_format text default null,
  p_publisher text default null,
  p_published_date text default null,
  p_genres text[] default null,
  p_description text default null,
  p_cover_image text default null,
  p_link text default null
) returns uuid as $$
declare
  v_book_id uuid;
begin
  insert into books (
    user_id, goodreads_id, title, author, isbn, isbn13,
    rating, date_read, date_started, shelves, page_count,
    format, publisher, published_date, genres, description,
    cover_image, link
  ) values (
    p_user_id, p_goodreads_id, p_title, p_author, p_isbn, p_isbn13,
    p_rating, p_date_read, p_date_started, p_shelves, p_page_count,
    p_format, p_publisher, p_published_date, p_genres, p_description,
    p_cover_image, p_link
  )
  on conflict (user_id, goodreads_id) do update set
    title = excluded.title,
    author = excluded.author,
    isbn = excluded.isbn,
    isbn13 = excluded.isbn13,
    rating = excluded.rating,
    date_read = excluded.date_read,
    date_started = excluded.date_started,
    shelves = excluded.shelves,
    page_count = excluded.page_count,
    format = excluded.format,
    publisher = excluded.publisher,
    published_date = excluded.published_date,
    genres = excluded.genres,
    description = excluded.description,
    cover_image = excluded.cover_image,
    link = excluded.link,
    updated_at = now()
  returning id into v_book_id;
  
  return v_book_id;
end;
$$ language plpgsql security definer;

-- Function to start a sync session
create or replace function start_book_sync(p_user_id uuid)
returns text as $$
declare
  v_sync_id text;
  v_active_session record;
begin
  -- Check for existing active session
  select * into v_active_session 
  from book_sync_sessions 
  where user_id = p_user_id 
  and completed_at is null;

  if v_active_session.sync_id is not null then
    -- Cancel old session if it's stale (older than 1 hour)
    if v_active_session.started_at < now() - interval '1 hour' then
      update book_sync_sessions 
      set status = 'cancelled', completed_at = now()
      where sync_id = v_active_session.sync_id;
    else
      raise exception 'A sync session is already in progress';
    end if;
  end if;

  -- Generate a unique sync ID
  v_sync_id := encode(gen_random_bytes(16), 'hex');
  
  -- Create new sync session
  insert into book_sync_sessions (sync_id, user_id)
  values (v_sync_id, p_user_id);
  
  return v_sync_id;
end;
$$ language plpgsql security definer;

-- Function to complete a sync session and cleanup old books
create or replace function complete_book_sync(
  p_sync_id text,
  p_user_id uuid
) returns void as $$
declare
  v_sync_started_at timestamp with time zone;
begin
  -- Get sync session start time
  select started_at into v_sync_started_at
  from book_sync_sessions
  where sync_id = p_sync_id and user_id = p_user_id;
  
  if v_sync_started_at is null then
    raise exception 'Invalid sync session';
  end if;
  
  -- Delete books that weren't updated during this sync
  delete from books
  where user_id = p_user_id
  and updated_at < v_sync_started_at;
  
  -- Mark sync as completed
  update book_sync_sessions
  set completed_at = now()
  where sync_id = p_sync_id;
end;
$$ language plpgsql security definer;

-- Function to get sync status
create or replace function get_sync_status(p_user_id uuid)
returns table (
  last_sync timestamp with time zone,
  book_count bigint,
  sync_in_progress boolean
) as $$
begin
  return query
  select
    max(completed_at) as last_sync,
    (select count(*) from books where user_id = p_user_id) as book_count,
    exists(
      select 1 from book_sync_sessions 
      where user_id = p_user_id and completed_at is null
    ) as sync_in_progress
  from book_sync_sessions
  where user_id = p_user_id;
end;
$$ language plpgsql security definer;

-- Function to track sync progress
create or replace function get_sync_progress(p_sync_id text)
returns table (
  progress integer,
  current_page integer,
  total_pages integer,
  status text
) as $$
begin
  return query
  select 
    case 
      when bs.total_books = 0 then 0
      else (bs.processed_books * 100 / bs.total_books)::integer
    end as progress,
    bs.current_page,
    bs.total_pages,
    bs.status
  from book_sync_sessions bs
  where bs.sync_id = p_sync_id;
end;
$$ language plpgsql security definer;

-- Add columns to book_sync_sessions
alter table book_sync_sessions 
add column if not exists total_books integer default 0,
add column if not exists processed_books integer default 0,
add column if not exists current_page integer default 0,
add column if not exists total_pages integer default 0,
add column if not exists status text default 'initializing';

-- Function to update sync progress
create or replace function update_sync_progress(
  p_sync_id text,
  p_processed_books integer,
  p_total_books integer,
  p_current_page integer,
  p_total_pages integer,
  p_status text
) returns void as $$
begin
  update book_sync_sessions
  set 
    processed_books = p_processed_books,
    total_books = p_total_books,
    current_page = p_current_page,
    total_pages = p_total_pages,
    status = p_status
  where sync_id = p_sync_id;
end;
$$ language plpgsql security definer;

-- Add book statistics function
create or replace function get_book_stats(p_user_id uuid)
returns table (
  total_books bigint,
  books_this_year bigint,
  avg_rating numeric,
  last_sync timestamp with time zone
) as $$
begin
  return query
  select
    count(*)::bigint as total_books,
    count(*) filter (
      where date_read >= date_trunc('year', now())
    )::bigint as books_this_year,
    round(avg(rating)::numeric, 1) as avg_rating,
    max(bs.completed_at) as last_sync
  from books b
  left join book_sync_sessions bs on bs.user_id = b.user_id
  where b.user_id = p_user_id;
end;
$$ language plpgsql security definer; 
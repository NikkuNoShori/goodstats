create table books (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  goodreads_id text not null,
  title text not null,
  author text not null,
  isbn text,
  isbn13 text,
  rating smallint check (rating >= 0 and rating <= 5),
  date_read timestamp with time zone,
  date_started timestamp with time zone,
  shelves text[],
  page_count integer,
  format text,
  publisher text,
  published_date text,
  genres text[],
  description text,
  cover_image text,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, goodreads_id)
);

-- Set up row level security
alter table books enable row level security;

create policy "Users can view own books"
  on books for select
  using ( auth.uid() = user_id );

create policy "Users can insert own books"
  on books for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own books"
  on books for update
  using ( auth.uid() = user_id );

create policy "Users can delete own books"
  on books for delete
  using ( auth.uid() = user_id );

-- Create updated_at trigger
create trigger books_updated_at
  before update on books
  for each row
  execute procedure handle_updated_at();

-- Create indexes
create index books_user_id_idx on books(user_id);
create index books_date_read_idx on books(date_read);
create index books_goodreads_id_idx on books(goodreads_id); 
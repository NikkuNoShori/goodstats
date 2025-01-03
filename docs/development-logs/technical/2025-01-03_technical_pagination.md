# Pagination Implementation

## Overview
Implementation of client-side pagination for the book grid to improve performance with large libraries.

## Technical Design

### 1. Pagination State
```typescript
interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Initial state in Dashboard component
const [pagination, setPagination] = useState<PaginationState>({
  page: 1,
  pageSize: 24, // 4x6 grid on large screens
  totalItems: 0,
  totalPages: 1
});
```

### 2. Supabase Query
```typescript
const { data: books = [], isLoading, error } = useQuery<Book[], QueryError>({
  queryKey: ['books', profile?.id, pagination.page, pagination.pageSize],
  queryFn: async () => {
    if (!profile?.id) return [];
    
    const { data, error, count } = await supabase
      .from('books')
      .select('*', { count: 'exact' })
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false })
      .range(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize - 1
      );
    
    if (error) throw error;
    
    // Update total items and pages
    if (count !== null) {
      setPagination(prev => ({
        ...prev,
        totalItems: count,
        totalPages: Math.ceil(count / pagination.pageSize)
      }));
    }
    
    return data || [];
  },
  enabled: !!profile?.id
});
```

### 3. Pagination Controls
```typescript
const PaginationControls = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center',
      alignItems: 'center',
      mt: 4,
      mb: 2,
      gap: 2
    }}>
      <Button
        disabled={pagination.page === 1}
        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
      >
        Previous
      </Button>
      
      <Typography>
        Page {pagination.page} of {pagination.totalPages}
      </Typography>
      
      <Button
        disabled={pagination.page === pagination.totalPages}
        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
      >
        Next
      </Button>
    </Box>
  );
};
```

### 4. URL State Management
```typescript
// URL state management
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const urlPage = parseInt(params.get('page') || '1');
  
  if (urlPage !== pagination.page) {
    setPagination(prev => ({ ...prev, page: urlPage }));
  }
}, []);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  params.set('page', pagination.page.toString());
  window.history.replaceState(
    {},
    '',
    `${window.location.pathname}?${params.toString()}`
  );
}, [pagination.page]);
```

### 5. Loading States
```typescript
// Loading state component
const LoadingState = () => (
  <Box sx={{ 
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1100 
  }}>
    <LinearProgress />
  </Box>
);

// Loading skeleton for book grid
const LoadingSkeleton = () => (
  <Box sx={{ 
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(2, 1fr)',
      sm: 'repeat(3, 1fr)',
      md: 'repeat(4, 1fr)',
      lg: 'repeat(6, 1fr)'
    },
    gap: 2
  }}>
    {Array.from({ length: pagination.pageSize }).map((_, i) => (
      <Skeleton 
        key={i}
        variant="rectangular"
        sx={{ 
          paddingTop: '150%',
          borderRadius: 1
        }}
      />
    ))}
  </Box>
);
```

## Implementation Steps
1. [ ] Add pagination state management
2. [ ] Update Supabase query with range
3. [ ] Add pagination controls
4. [ ] Implement URL state sync
5. [ ] Add loading states
6. [ ] Test with large datasets

## Testing Strategy
1. Unit Tests
   - Pagination calculations
   - State management
   - URL sync

2. Integration Tests
   - Data fetching
   - Navigation
   - Loading states

3. Performance Tests
   - Load time per page
   - Memory usage
   - Scroll behavior

## Success Criteria
1. Performance
   - <1s page load time
   - Smooth transitions
   - No memory leaks

2. UX
   - Clear loading states
   - Intuitive controls
   - URL state preserved

3. Reliability
   - Consistent page size
   - Error handling
   - State preservation

## Notes
- Consider implementing infinite scroll later
- Monitor memory usage
- Track user navigation patterns 
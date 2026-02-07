# Project Rules & Lessons Learned

## Common Mistakes to Avoid

### 1. Next.js Client Component Hooks
- **Error**: `ReferenceError: usePathname is not defined` or `Active link logic failing`
- **Cause**: Using `usePathname`, `useRouter`, or `useSearchParams` without importing them from `next/navigation`.
- **Rule**: When adding `usePathname()` or similar hooks, ALWAYS verify that the import statement exists at the top of the file:
  ```typescript
  import { usePathname } from 'next/navigation';
  ```

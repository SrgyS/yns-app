1. Keep Cognitive Complexity ≤ 15 per function (typescript:S3776).
Avoid deep nesting and complex condition chains.
Extract smaller, well-named functions instead of increasing nesting.

2. Disallow unnecessary fallback objects in object spread (typescript:S7744).
Object spread safely ignores falsy values — do not use || {} or ?? {}.

3. Do not use deprecated APIs/types (TypeScript S1874). If you encounter @deprecated, replace with the recommended alternative and avoid introducing new usages.
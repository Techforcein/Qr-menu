# PageForge Contact Forms Studio – installation

This package adds an initial working Contact Forms module to your existing PageForge project.

## Included
- `contact-studio.html/css/js`: authenticated owner workspace, 20 template presets, form editor, field builder, design controls, form management, response list and CSV export.
- `contact-public.html/js`: public published form and customer submission flow.
- `contact-schema.sql`: Supabase tables and Row Level Security policies.
- `index.html`: your uploaded PageForge dashboard with a Contact Forms link added to the + menu.

## Install on GitHub (mobile-friendly)
1. Make a backup of your current repository.
2. Open your repository and upload all six `contact-*` files to the same folder as `index.html`, `config.js`, and `restaurant-builder.html`.
3. Replace the existing `index.html` with the included updated `index.html`.
4. In Supabase, open SQL Editor → New query.
5. Open `contact-schema.sql`, copy all SQL, paste it into SQL Editor, and press Run.
6. Wait for success. Do not add a service-role key to any browser file. The module uses your existing `config.js` publishable key.
7. Wait for GitHub Pages to deploy, then sign in to PageForge and use the + menu → Contact Forms.
8. Create a form, add questions, select a template, customize the design, and Save.
9. Publish the form from My forms. Copy its link and open it in an incognito/private tab to test a customer submission.
10. Return to Contact Forms → Responses to confirm the test appears.

## Important current scope
This is the first functional foundation. The question builder includes short/long answer, choice, checkboxes, dropdown, multi-select, number, email, phone, link, date, time, linear scale, matrix, rating, signature-style text area and ranking-style choices. The UI lists 20 distinct visual presets and lets you customize colors, font, width, radius and effects.

File upload and drawn signature capture, true multi-page/conversational behavior, conditional logic, advanced analytics, response detail view, QR generation and stronger spam/rate limiting are not yet implemented in this first package. Do not collect sensitive documents or highly sensitive personal data with this initial version. Add those features in later stages after secure upload/validation is implemented.

## Security notes
- RLS restricts form editing to the authenticated owner.
- Public users can read only published forms.
- Public users can insert submissions only for published forms.
- Only the owner can read or delete submissions.
- Never disable RLS or expose a Supabase service-role key.
- This initial version stores answers as JSON in one submission row. Validate this in a test project before using it for real customer data.

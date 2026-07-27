# Waitlist observability

The application emits structured server log events for waitlist submit
success, validation failure, configuration failure, database failure, and rate
limit rejection. Browser image failures emit a first-party event only. No
third-party analytics, cookies, fingerprinting, email address, ZIP, client IP,
or rate-limit key is logged.

Before launch, the deployment owner must configure platform-log retention to
30 days or less and confirm that downstream log drains apply the same maximum.
This repository does not configure Vercel or a log drain.


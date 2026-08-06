# TODO - FWS Health Monitor

## SSL Certificate Checker Feature

A new page/tool to monitor SSL certificates for websites and track expiration dates.

### User Requirements
- See SSL certificate information from a website URL
- Check if certificate needs renewal
- Identify who is responsible for the certificate
- Track certificate expiration dates

### Architecture Questions to Resolve
1. **Data & Storage:**
   - Should SSL certificate data be stored in the database (like endpoints) so you can track them over time?
   - Or is it a quick lookup tool - just paste a URL, see the cert info, no storage?

2. **Integration:**
   - Should this be a separate new page (e.g., `/system/ssl-checker`) or integrated into the existing health monitor?
   - Should SSL certificate checks be automated with your regular health checks (every 5 minutes)?

3. **Information to Display:**
   - Most important details: expiration date, days remaining, issuer, subject (domain), issued date?
   - Should it warn you if expiration is within X days (e.g., 30 days)?

4. **UI/UX:**
   - Single URL lookup (paste URL, see cert info)?
   - Or a table of tracked URLs (like your endpoints page) with expiration status?

5. **Backend Logic:**
   - In NestJS, should I create a new SSL service that uses Node's `tls` module to fetch certificates?
   - Should it handle domain names only, or also subdomains/multiple SANs?

### Technical Implementation Path
- Create new NestJS service: `ssl-certificate.service.ts`
- Create Mongoose schema for storing SSL certificates (if persistent storage)
- Create API endpoint(s) for querying certificate info
- Create new Solid.js page for SSL certificate management
- Use Node.js `tls` module to connect and read certificates
- Display certificate metadata (issuer, subject, expiration, days remaining)
- Optional: Add warning alerts for certificates expiring soon

### Files Likely Needed
- `apps/health_monitor_api/src/ssl-certificate/ssl-certificate.service.ts`
- `apps/health_monitor_api/src/ssl-certificate/ssl-certificate.controller.ts`
- `apps/health_monitor_api/src/ssl-certificate/schemas/ssl-certificate.schema.ts`
- `apps/health_monitor_ui/src/components/pages/SSLCertificateCheckerPage.tsx`


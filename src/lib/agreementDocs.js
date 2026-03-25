/**
 * Agreement document generator.
 *
 * Takes a signed agreement record and produces a complete, print-ready HTML
 * document containing the full agreement text with the signer's name, date,
 * and signature filled in. No "Printed" or "Title" fields — electronic only.
 *
 * Call generateSignedDocHtml(record) → HTML string
 * Then: window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })))
 */

const SHARED_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..900;1,8..60,300..900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 11.5pt;
    line-height: 1.7;
    color: #1a1a1a;
    background: #fff;
    padding: 0;
  }
  .page {
    max-width: 750px;
    margin: 0 auto;
    padding: 60px 70px 80px;
  }
  /* Header */
  .doc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 24px;
    margin-bottom: 36px;
    border-bottom: 2px solid #0a2d6e;
  }
  .doc-header .brand { font-size: 9pt; color: #555; text-align: right; line-height: 1.4; }
  .doc-header .brand strong { color: #0a2d6e; font-size: 10pt; }
  /* Title */
  h1.doc-title {
    text-align: center;
    font-size: 22pt;
    font-weight: 700;
    letter-spacing: -0.3px;
    margin-bottom: 28px;
    color: #0a2d6e;
  }
  .intro { margin-bottom: 28px; text-align: justify; }
  /* Sections */
  h2.section-head {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-top: 28px;
    margin-bottom: 8px;
    color: #0a2d6e;
  }
  p { margin-bottom: 12px; text-align: justify; }
  ol, ul { margin-left: 22px; margin-bottom: 12px; }
  li { margin-bottom: 6px; }
  strong { font-weight: 700; }
  /* Signature block */
  .sig-block {
    margin-top: 52px;
    padding-top: 28px;
    border-top: 1.5px solid #ccc;
  }
  .sig-block-title {
    font-size: 10pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #555;
    margin-bottom: 24px;
  }
  .sig-row {
    display: flex;
    gap: 60px;
    align-items: flex-end;
    margin-bottom: 20px;
  }
  .sig-field { flex: 1; }
  .sig-label {
    font-size: 8.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #777;
    margin-bottom: 6px;
  }
  .sig-value {
    border-bottom: 1.5px solid #333;
    padding-bottom: 4px;
    min-height: 36px;
    display: flex;
    align-items: flex-end;
  }
  .sig-cursive {
    font-family: 'Dancing Script', cursive;
    font-size: 22pt;
    color: #0a2d6e;
    line-height: 1;
  }
  .sig-text {
    font-size: 10pt;
    color: #333;
  }
  /* Certification footer */
  .cert-footer {
    margin-top: 48px;
    padding: 16px 20px;
    background: #f4f7ff;
    border: 1px solid #c7d7f5;
    border-radius: 6px;
    font-size: 8.5pt;
    color: #555;
    line-height: 1.6;
  }
  .cert-footer strong { color: #0a2d6e; }
  /* Print styles */
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .no-print { display: none !important; }
    .page { padding: 40px 50px; }
  }
  /* Print button */
  .print-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    background: #0a2d6e;
    color: #fff;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: -apple-system, sans-serif;
    font-size: 13px;
    z-index: 1000;
  }
  .print-bar button {
    background: #47C9F3;
    color: #0a2d6e;
    border: none;
    padding: 6px 18px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
  }
  .print-bar button:hover { background: #6dd9f8; }
  body.has-bar .page { padding-top: 100px; }
`

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })
}

// ── Subcontractor Agreement ────────────────────────────────────────────────────
function subcontractorBody(record) {
  const { signerName, signedAt } = record
  const effectiveDate = formatDate(signedAt)
  return `
<h1 class="doc-title">Sub-Contract Agreement</h1>
<p class="intro">
  This Subcontract Agreement (the "Agreement") is entered into between <strong>Edit Me Lo</strong>
  (the "Agency") and <strong>${signerName}</strong> (the "Subcontractor"), collectively "Parties",
  on this <strong>${effectiveDate}</strong>.
</p>

<h2 class="section-head">Section 1. Term of Agreement</h2>
<p>This Agreement shall commence on the Effective Date and continue for a period of one (1) year,
unless earlier terminated as provided in Section 7. Termination. The Agreement will automatically
renew for subsequent one (1) year periods unless either party provides written notice of non-renewal
at least thirty (30) days prior to the end of the current term.</p>

<h2 class="section-head">Section 2. Scope of Work</h2>
<p>The Agency may request revisions or modifications to the work, which the Subcontractor will
reasonably accommodate, provided they do not significantly deviate from the original scope.</p>
<p><strong>Any request for revisions or modifications that would result in more than twenty-four (24)
additional hours of work or significantly change the scope as defined in the SOW shall be considered
a change order, requiring a written amendment to this Agreement and a renegotiation of
compensation.</strong></p>

<h2 class="section-head">Section 3. Compensation</h2>
<p>The Subcontractor shall be compensated for services rendered on a project-by-project basis, as
defined and agreed upon in separate Statements of Work (SOWs) or other written project agreements.
Compensation for each project will be one of the following mutually agreed-upon methods, specified
in the applicable SOW:</p>
<ol>
  <li><strong>Revenue Share:</strong> The agreed discussed payment, which shall be equivalent to between
  <strong>Forty Percent (40%) and Fifty Percent (50%)</strong> of the total fee paid to the Agency by
  the end-client for the services performed by the Subcontractor; OR</li>
  <li><strong>Fixed Price or Rate:</strong> A specific price or rate for the services that has been
  discussed and agreed upon by both parties prior to the project start.</li>
</ol>
<p>Payment terms for each project, including frequency, deposit, and milestone requirements, shall be
specified in the applicable SOW. The Agency will reimburse the Subcontractor for any pre-approved,
reasonable, and necessary expenses incurred in the performance of the services, subject to providing
appropriate supporting documentation.</p>

<h2 class="section-head">Section 4. Intellectual Property Rights</h2>
<p>The Agency shall retain all rights, title, and interest in the final deliverables created by the
Subcontractor, including but not limited to copyrights and other intellectual property rights
(the "Work Product").</p>
<p>The Subcontractor retains ownership of all pre-existing intellectual property, tools, and general
methodologies used to create the Work Product ("Subcontractor IP"). The Subcontractor grants the
Agency a non-exclusive, royalty-free, perpetual, worldwide license to use, reproduce, and modify
the Subcontractor IP solely to the extent necessary to utilize the Work Product.</p>
<p>The Subcontractor agrees not to use or disclose any confidential or proprietary information obtained
from the Agency during the course of this Agreement, both during and after the term of this
Agreement.</p>

<h2 class="section-head">Section 5. Relationship of Parties</h2>
<p>The Subcontractor is an independent contractor and shall not be considered an employee, partner,
or agent of the Agency. The Subcontractor shall be responsible for paying their own taxes and
providing their own equipment, tools, and supplies necessary to perform the services.</p>
<p>The Subcontractor shall maintain, at its own expense, adequate professional liability insurance
and/or general commercial liability insurance, if applicable, during the term of this Agreement
and shall provide the Agency with proof of such coverage upon request.</p>

<h2 class="section-head">Section 6. Confidentiality</h2>
<p>Both parties agree to maintain the confidentiality of any proprietary or sensitive information
disclosed by the other party during the course of this Agreement. The Subcontractor shall not
disclose or use any confidential information obtained from the Agency for any purpose other than
performing the agreed-upon services.</p>

<h2 class="section-head">Section 7. Termination</h2>
<p>Either party may terminate this Agreement with written notice in the event of a material breach
by the other party. <strong>A material breach includes, but is not limited to, failure to deliver
services on time without reasonable justification or failure to make timely payments.</strong></p>
<p>Before termination for material breach, the non-breaching party must provide <strong>fifteen (15)
days</strong> written notice to the breaching party, allowing a reasonable opportunity to cure the
breach.</p>
<p>Upon termination, the Subcontractor shall be compensated for the services rendered up to the date
of termination.</p>

<h2 class="section-head">Section 8. Governing Law</h2>
<p>This Agreement shall be governed by and construed in accordance with the laws of <strong>Indiana</strong>.
Any disputes arising out of or relating to this Agreement shall be resolved first through mediation
and if the Parties are unable to come to an agreement, then the Parties shall submit to binding
arbitration.</p>

<h2 class="section-head">Section 9. Warranties and Indemnification</h2>
<p><strong>Warranties:</strong> The Subcontractor warrants that all deliverables are original, have not
been previously published, and do not and will not infringe upon any third party's intellectual
property, proprietary, or contractual rights.</p>
<p><strong>Indemnification:</strong> The Subcontractor agrees to indemnify and hold the Agency harmless
from any and all claims, damages, losses, and expenses (including reasonable attorney's fees) arising
out of the Subcontractor's performance under this Agreement, including any breach of the warranties
stated herein or any claim that the deliverables infringe upon a third party's rights.</p>

<h2 class="section-head">Section 10. Entire Agreement</h2>
<p>This Agreement constitutes the entire agreement between the Agency and the Subcontractor and
supersedes any prior discussions, negotiations, or agreements, whether written or oral, relating to
the subject matter hereof.</p>

<p style="margin-top:24px;">IN WITNESS WHEREOF, the parties have executed this Subcontract Agreement as of the date
first written above.</p>
`
}

// ── NDA ───────────────────────────────────────────────────────────────────────
function ndaBody(record) {
  const { signerName, signedAt } = record
  const effectiveDate = formatDate(signedAt)
  return `
<h1 class="doc-title">Non-Disclosure Agreement</h1>
<p class="intro">
  This Non-Disclosure Agreement ("Agreement") is entered into as of <strong>${effectiveDate}</strong>
  ("Effective Date"), by and between <strong>Edit Me Lo Graphic Design Agency</strong> ("Company"),
  located at <em>6101 North Keystone Ste. 100 #1542, Indianapolis, Indiana 46220</em>,
  and <strong>${signerName}</strong> ("Recipient").
</p>

<h2 class="section-head">Section 1. Purpose of Agreement</h2>
<p>The purpose of this Agreement is to protect the confidential and proprietary information of the
Company and to ensure that the Recipient maintains the confidentiality of such information during
and after the Recipient's association with the Company.</p>

<h2 class="section-head">Section 2. Definition of Confidential Information</h2>
<p>Confidential Information includes, but is not limited to, any and all non-public, proprietary, or
confidential information, knowledge, or data received by Recipient in any form from Company or any
of its affiliate entities, including any parent, subsidiary or division, or employees, whether or
not marked as confidential, including but not limited to the following categories of information:
"know-how"; business plans; operations agendas; business contracts; reports; vendor lists; marketing
copy and/or printwork; internal correspondence; investigations; experiments; research; work in
progress; algorithms; software; projects and documents; codes; proposals; prospective business
opportunities; drawings; blueprints; schematics; specifications and requirements (e.g. material,
customer, and supplier specifications); functional details; estimated volumes; financial information;
technical information; spend information; financial forecasts; part numbers; trade secrets;
information that a reasonable person would consider non-public, confidential, or proprietary given
the nature of the information or the circumstances of its disclosure; any derivatives or copies of
the foregoing.</p>

<h2 class="section-head">Section 3. Intellectual Property Rights</h2>
<p>Recipient agrees that all Confidential Information, trade secrets, all inventions, all works of
authorship (including illustration, writings, mask works, software and computer programs), and all
other business and technical information created or conceived by Recipient, either alone or with
others, while (1) working with Company and related to the existing or contemplated business or
research of Company or (2) resulting from work with Company, belong to Company ("Company's
Intellectual Property"). Until proven otherwise by Recipient, any invention shall be presumed to
have been conceived during the term of engagement, if within one (1) year after termination it is
disclosed to others, or it is completed, or it has a patent application filed thereon.</p>

<h2 class="section-head">Section 4. Obligations of Recipient</h2>
<p><strong>(a) Confidentiality:</strong> The Recipient agrees to hold all Confidential Information in
strict confidence and to take all necessary precautions to prevent its unauthorized disclosure, both
during and after the Recipient's association with the Company.</p>
<p><strong>(b) Non-Disclosure:</strong> The Recipient agrees not to disclose, directly or indirectly,
any confidential information to any third party without the prior written consent of the Company,
except as required by law.</p>
<p><strong>(c) Use of Confidential Information:</strong> The Recipient agrees not to use the
Confidential Information for any purpose other than the performance of their duties for the Company
or as otherwise authorized in writing by the Company.</p>

<h2 class="section-head">Section 5. Return of Confidential Information</h2>
<p>Upon the termination of the Recipient's association with the Company or at any time upon the
Company's request, the Recipient shall promptly return or destroy all documents, records, files, and
any other materials containing or relating to the Confidential Information, including any copies or
reproductions thereof, and shall provide written confirmation of such return or destruction.</p>

<h2 class="section-head">Section 6. Remedies</h2>
<p>The parties acknowledge and agree that any unauthorized use or disclosure of the confidential
information may cause irreparable harm to the Company, and that in the event of such unauthorized
use or disclosure, the Company shall be entitled to seek injunctive relief, in addition to any other
remedies available at law or in equity.</p>

<h2 class="section-head">Section 7. Governing Law and Jurisdiction</h2>
<p>This Agreement shall be governed by and construed in accordance with the laws of
<strong>Indiana</strong>. Any disputes arising out of or in connection with this Agreement shall be
subject to the exclusive jurisdiction of the courts of Indiana.</p>

<h2 class="section-head">Section 8. Severability</h2>
<p>If any provision of this Agreement is found to be invalid, illegal, or unenforceable, the remaining
provisions shall continue in full force and effect.</p>

<h2 class="section-head">Section 9. Entire Agreement</h2>
<p>This Agreement constitutes the entire agreement between the parties with respect to the subject
matter hereof and supersedes all prior negotiations, understandings, and agreements, whether oral
or written.</p>

<h2 class="section-head">Section 10. Term and Application</h2>
<p>This Agreement shall remain in full force and effect for a period of one (1) year from the
Effective Date, unless terminated earlier by mutual written agreement. This Agreement applies to all
projects worked on by the Recipient for the Company within the duration of this one-year term. The
confidentiality obligations set forth in Section 4 shall survive the termination or expiration of
this Agreement and shall continue indefinitely.</p>

<p style="margin-top:24px;">IN WITNESS WHEREOF, the parties hereto have executed this Non-Disclosure Agreement as of
the Effective Date.</p>
`
}

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * Generates a complete, print-ready HTML document for a signed agreement.
 * @param {object} record — agreement record from agreementStore
 * @returns {string} — full HTML page as a string
 */
export function generateSignedDocHtml(record) {
  const body = record.docId === 'nda' ? ndaBody(record) : subcontractorBody(record)
  const signedDateTime = formatDateTime(record.signedAt)
  const expiresDate    = formatDate(record.expiresAt)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${record.title} — ${record.signerName} — ${formatDate(record.signedAt)}</title>
  <style>${SHARED_STYLES}</style>
</head>
<body class="has-bar">
  <!-- Print bar (hidden on print) -->
  <div class="print-bar no-print">
    <span>${record.title} &mdash; ${record.signerName}</span>
    <button onclick="window.print()">Save / Print as PDF</button>
  </div>

  <div class="page">
    <!-- Document header -->
    <div class="doc-header">
      <div style="font-size:9pt; color:#0a2d6e; font-weight:700; letter-spacing:0.5px; text-transform:uppercase;">
        Edit Me Lo
      </div>
      <div class="brand">
        <strong>Edit Me Lo Graphic Design Agency</strong><br/>
        6101 North Keystone Ste. 100 #1542, Indianapolis, IN 46220<br/>
        Document ID: ${record.id} &nbsp;|&nbsp; v${record.version}
      </div>
    </div>

    <!-- Agreement body (filled in) -->
    ${body}

    <!-- Signature block -->
    <div class="sig-block">
      <p class="sig-block-title">Electronic Execution</p>

      <div class="sig-row">
        <div class="sig-field">
          <div class="sig-label">Subcontractor / Recipient Signature</div>
          <div class="sig-value">
            <span class="sig-cursive">${record.signatureText}</span>
          </div>
        </div>
        <div class="sig-field" style="max-width:220px;">
          <div class="sig-label">Date Signed</div>
          <div class="sig-value">
            <span class="sig-text">${formatDate(record.signedAt)}</span>
          </div>
        </div>
      </div>

      <div class="sig-row" style="margin-top:16px;">
        <div class="sig-field">
          <div class="sig-label">Agency — Edit Me Lo</div>
          <div class="sig-value">
            <span class="sig-cursive" style="color:#555; font-size:18pt;">Lauren — Edit Me Lo</span>
          </div>
        </div>
        <div class="sig-field" style="max-width:220px;">
          <div class="sig-label">Active Through</div>
          <div class="sig-value">
            <span class="sig-text">${expiresDate}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Certification footer -->
    <div class="cert-footer">
      <strong>Electronic Signature Certification</strong><br/>
      This document was electronically executed via the <strong>EML Portal</strong> on
      <strong>${signedDateTime}</strong>.<br/>
      Signer: <strong>${record.signerName}</strong>${record.signerEmail ? ' &lt;' + record.signerEmail + '&gt;' : ''} &nbsp;&bull;&nbsp;
      ${record.ipNote} &nbsp;&bull;&nbsp; Document v${record.version}<br/>
      This electronic signature is legally binding under the ESIGN Act (15 U.S.C. § 7001) and
      the Uniform Electronic Transactions Act (UETA).
    </div>
  </div>
</body>
</html>`
}

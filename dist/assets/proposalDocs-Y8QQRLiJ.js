import{e as f,p as u}from"./index-ze2urEtO.js";function h(e,o){const n=new Date(e);return n.setDate(n.getDate()+o),n.toISOString()}const y=f(u((e,o)=>({proposals:[],serviceAgreements:[],addendums:[],createProposal:n=>{const i={id:`prop_${Date.now()}`,...n,status:"draft",revisions:[],version:1,sentAt:null,validUntil:null,respondedAt:null,createdAt:new Date().toISOString()};return e(t=>({proposals:[i,...t.proposals]})),i},sendProposal:n=>{const i=new Date().toISOString(),t=h(i,30);e(a=>({proposals:a.proposals.map(s=>s.id===n?{...s,status:"sent",sentAt:i,validUntil:t}:s)}))},updateProposal:(n,i)=>{e(t=>({proposals:t.proposals.map(a=>a.id===n?{...a,...i}:a)}))},acceptProposal:n=>{const i=new Date().toISOString(),t=o().proposals.find(s=>s.id===n);if(!t)return null;e(s=>({proposals:s.proposals.map(r=>r.id===n?{...r,status:"accepted",respondedAt:i}:r)}));const a={id:`svc_${Date.now()}`,proposalId:n,projectId:t.projectId,clientId:t.clientId,clientName:t.clientName,clientEmail:t.clientEmail,projectName:t.projectName,serviceTitle:t.serviceTitle,packageTier:t.packageTier,scopeItems:t.scopeItems,timeline:t.timeline,totalAmount:t.totalAmount,depositAmount:t.depositAmount,notes:t.notes,signatureText:null,signedAt:null,sentAt:i,status:"pending"};return e(s=>({serviceAgreements:[a,...s.serviceAgreements]})),a},denyProposal:(n,i)=>{const t=new Date().toISOString();e(a=>({proposals:a.proposals.map(s=>{var p;if(s.id!==n)return s;const r=(((p=s.revisions)==null?void 0:p.length)??0)+1;return{...s,status:"denied",respondedAt:t,revisions:[...s.revisions??[],{round:r,deniedAt:t,denialNotes:i,revisedAt:null}]}})}))},reviseProposal:(n,i)=>{const t=new Date().toISOString(),a=h(t,30);e(s=>({proposals:s.proposals.map(r=>{if(r.id!==n)return r;const p=(r.revisions??[]).map((g,v)=>v===r.revisions.length-1?{...g,revisedAt:t}:g);return{...r,...i,status:"sent",sentAt:t,validUntil:a,respondedAt:null,version:r.version+1,revisions:p}})}))},signServiceAgreement:(n,i)=>{const t=new Date().toISOString();e(a=>({serviceAgreements:a.serviceAgreements.map(s=>s.id===n?{...s,signatureText:i,signedAt:t,status:"signed"}:s)}))},createAddendum:n=>{const i=new Date().toISOString(),t={id:`add_${Date.now()}`,...n,signatureText:null,signedAt:null,sentAt:i,status:"pending",createdAt:i};return e(a=>({addendums:[t,...a.addendums]})),t},signAddendum:(n,i)=>{const t=new Date().toISOString();e(a=>({addendums:a.addendums.map(s=>s.id===n?{...s,signatureText:i,signedAt:t,status:"signed"}:s)}))},getClientProposals:n=>o().proposals.filter(i=>i.clientId===n).sort((i,t)=>new Date(t.createdAt)-new Date(i.createdAt)),getClientServiceAgreements:n=>o().serviceAgreements.filter(i=>i.clientId===n).sort((i,t)=>new Date(t.sentAt)-new Date(i.sentAt)),getClientAddendums:n=>o().addendums.filter(i=>i.clientId===n).sort((i,t)=>new Date(t.sentAt)-new Date(i.sentAt)),getActiveProposal:n=>o().proposals.filter(i=>i.clientId===n&&i.status!=="draft").sort((i,t)=>new Date(t.sentAt)-new Date(i.sentAt))[0]??null}),{name:"eml_proposals",partialize:e=>({proposals:e.proposals,serviceAgreements:e.serviceAgreements,addendums:e.addendums})})),m=`
  @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..900;1,8..60,300..900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Source Serif 4', Georgia, serif;
    font-size: 11.5pt;
    line-height: 1.7;
    color: #1a1a1a;
    background: #fff;
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
  .doc-header .brand-name {
    font-family: -apple-system, sans-serif;
    font-size: 18pt;
    font-weight: 800;
    color: #0a2d6e;
    letter-spacing: -0.5px;
  }
  .doc-header .brand-contact {
    font-size: 8.5pt;
    color: #555;
    text-align: right;
    line-height: 1.6;
    font-family: -apple-system, sans-serif;
  }
  /* Title */
  h1.doc-title {
    text-align: center;
    font-size: 22pt;
    font-weight: 700;
    letter-spacing: -0.3px;
    margin-bottom: 8px;
    color: #0a2d6e;
  }
  .doc-subtitle {
    text-align: center;
    font-size: 12pt;
    color: #555;
    margin-bottom: 36px;
    font-family: -apple-system, sans-serif;
  }
  .meta-row {
    display: flex;
    gap: 32px;
    background: #f4f7ff;
    border: 1px solid #c7d7f5;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 36px;
    font-family: -apple-system, sans-serif;
  }
  .meta-item { flex: 1; }
  .meta-label {
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #888;
    margin-bottom: 3px;
  }
  .meta-value { font-size: 10pt; color: #1a1a1a; font-weight: 600; }
  /* Sections */
  h2.section-head {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-top: 36px;
    margin-bottom: 10px;
    color: #0a2d6e;
    padding-bottom: 6px;
    border-bottom: 1px solid #e0e8f7;
  }
  p { margin-bottom: 12px; text-align: justify; }
  ol, ul { margin-left: 22px; margin-bottom: 14px; }
  li { margin-bottom: 5px; line-height: 1.6; }
  strong { font-weight: 700; }
  /* Tables */
  table.doc-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 10.5pt;
  }
  table.doc-table th {
    background: #0a2d6e;
    color: #fff;
    padding: 9px 14px;
    text-align: left;
    font-size: 8.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    font-family: -apple-system, sans-serif;
  }
  table.doc-table td {
    padding: 10px 14px;
    border-bottom: 1px solid #e8edf5;
    vertical-align: top;
    line-height: 1.5;
  }
  table.doc-table tr:nth-child(even) td { background: #f8f9fd; }
  table.doc-table .amount { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
  table.doc-table .total-row td {
    border-top: 2px solid #0a2d6e;
    font-weight: 700;
    background: #f4f7ff;
  }
  table.doc-table .deposit-row td { color: #0a7a4a; }
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
    font-family: -apple-system, sans-serif;
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
    font-family: -apple-system, sans-serif;
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
  .sig-text { font-size: 10pt; color: #333; font-family: -apple-system, sans-serif; }
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
    font-family: -apple-system, sans-serif;
  }
  .cert-footer strong { color: #0a2d6e; }
  /* Divider */
  .page-break { page-break-after: always; }
  .attachment-header {
    text-align: center;
    padding: 32px 0 24px;
    border-bottom: 2px solid #0a2d6e;
    margin-bottom: 32px;
  }
  .attachment-header h2 {
    font-size: 16pt;
    font-weight: 700;
    color: #0a2d6e;
    margin-bottom: 4px;
  }
  .attachment-header p { text-align: center; font-size: 10pt; color: #666; margin: 0; }
  /* Valid notice */
  .valid-notice {
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 6px;
    padding: 12px 18px;
    font-size: 9.5pt;
    color: #92400e;
    margin-bottom: 28px;
    font-family: -apple-system, sans-serif;
  }
  /* Print styles */
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .no-print { display: none !important; }
    .page { padding: 40px 50px; }
  }
  /* Print bar */
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
`;function c(e){return new Date(e).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}function l(e){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(e)}function d(e){return Math.round(e*.03*100)/100}function w(e){const o=e.sentAt?c(e.sentAt):c(new Date().toISOString()),n=e.validUntil?c(e.validUntil):"",i=d(e.totalAmount),t=e.depositAmount??Math.round(e.totalAmount*.5*100)/100,a=e.totalAmount-t,s=(e.scopeItems??[]).map(p=>`
    <tr><td>${p}</td></tr>
  `).join(""),r=e.version>1?`<div style="text-align:center;font-size:9pt;color:#888;font-family:-apple-system,sans-serif;margin-bottom:8px;">Revision ${e.version-1} — Updated ${o}</div>`:"";return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Project Proposal — ${e.projectName}</title>
  <style>${m}</style>
</head>
<body class="has-bar">
  <div class="print-bar no-print">
    <span>Edit Me Lo — Project Proposal</span>
    <button onclick="window.print()">Save / Print as PDF</button>
  </div>

  <div class="page">
    <div class="doc-header">
      <div class="brand-name">Edit Me Lo</div>
      <div class="brand-contact">
        <strong>www.editmelo.com</strong><br>
        hello@editmelo.com<br>
        Creative Studio &amp; Design Agency
      </div>
    </div>

    ${r}
    <h1 class="doc-title">Project Proposal</h1>
    <div class="doc-subtitle">${e.projectName}</div>

    <div class="meta-row">
      <div class="meta-item">
        <div class="meta-label">Prepared For</div>
        <div class="meta-value">${e.clientName}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Date Issued</div>
        <div class="meta-value">${o}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Valid Until</div>
        <div class="meta-value">${n}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Service</div>
        <div class="meta-value">${e.serviceTitle}</div>
      </div>
    </div>

    <div class="valid-notice">
      ⏳ This proposal is valid for <strong>30 days</strong> from the date of issue. To proceed, please log into the EML Client Portal and click <strong>"Accept Proposal"</strong>.
    </div>

    <h2 class="section-head">About Edit Me Lo</h2>
    <p>
      Edit Me Lo is a boutique creative studio specializing in brand identity, digital design, and visual storytelling. We partner with entrepreneurs, small businesses, and growing brands to build cohesive, professional aesthetics that connect with their audience and elevate their presence.
    </p>
    <p>
      Every project we take on is approached with intentional strategy, creative precision, and a deep commitment to your vision. We don't just design — we build brands that tell your story.
    </p>

    <h2 class="section-head">Project Objective</h2>
    <p>
      This proposal outlines the scope of work, deliverables, timeline, and investment for <strong>${e.projectName}</strong>. Our goal is to deliver a complete <strong>${e.serviceTitle}</strong> that meets your brand goals and exceeds expectations.
    </p>
    ${e.notes?`<p>${e.notes}</p>`:""}

    <h2 class="section-head">Proposed Timeline</h2>
    <table class="doc-table">
      <thead>
        <tr>
          <th>Phase</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Kickoff Meeting</strong></td>
          <td>Discovery call to align on goals, brand direction, and creative brief.</td>
        </tr>
        <tr>
          <td><strong>Active Work</strong></td>
          <td>Design and development phase. Initial concepts delivered for review.</td>
        </tr>
        <tr>
          <td><strong>Review &amp; Revisions</strong></td>
          <td>Collaborative feedback rounds to refine and perfect deliverables.</td>
        </tr>
        <tr>
          <td><strong>Final Delivery</strong></td>
          <td>All final files packaged and delivered. Project closed out.</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size:10pt;color:#555;font-family:-apple-system,sans-serif;">
      <strong>Estimated duration:</strong> ${e.timeline}
    </p>

    <h2 class="section-head">Project Process</h2>
    <ol>
      <li><strong>Discovery &amp; Brief</strong> — We start with a deep dive into your brand, goals, and target audience.</li>
      <li><strong>Proposal &amp; Agreement</strong> — Scope, timeline, and investment confirmed in writing.</li>
      <li><strong>Kickoff Meeting</strong> — Align the team and finalize the creative direction.</li>
      <li><strong>Concept Development</strong> — Initial designs created based on the agreed brief.</li>
      <li><strong>First Presentation</strong> — Concepts presented via the client portal for review.</li>
      <li><strong>Revision Rounds</strong> — Feedback incorporated per the agreed number of revision rounds.</li>
      <li><strong>Final Approval</strong> — Client approves final deliverables through the portal.</li>
      <li><strong>Delivery &amp; Handoff</strong> — All final files delivered in agreed formats. Project complete.</li>
    </ol>

    <h2 class="section-head">Scope of Work</h2>
    <p>The following deliverables are included in this proposal:</p>
    <table class="doc-table">
      <thead>
        <tr>
          <th>Deliverable</th>
        </tr>
      </thead>
      <tbody>
        ${s||"<tr><td>To be defined</td></tr>"}
      </tbody>
    </table>

    <h2 class="section-head">Investment</h2>
    <table class="doc-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${e.serviceTitle} — ${e.packageTier??""} Package</td>
          <td class="amount">${l(e.totalAmount)}</td>
        </tr>
        <tr>
          <td>Payment Processing Fee (3%)</td>
          <td class="amount">${l(i)}</td>
        </tr>
        <tr class="total-row">
          <td>Total Investment</td>
          <td class="amount">${l(e.totalAmount+i)}</td>
        </tr>
        <tr class="deposit-row">
          <td>50% Deposit (due upon signing — non-refundable)</td>
          <td class="amount">${l(t+d(t))}</td>
        </tr>
        <tr>
          <td>Remaining Balance (due upon final delivery)</td>
          <td class="amount">${l(a+d(a))}</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size:9.5pt;color:#777;font-family:-apple-system,sans-serif;">
      Payment processing fees are applied to all transactions. The 50% deposit is non-refundable and required to begin work. The remaining balance is due upon delivery of final files.
    </p>

    <div class="cert-footer" style="margin-top:40px;">
      <strong>Ready to move forward?</strong> Log into your EML Client Portal and click <strong>"Accept Proposal"</strong> to proceed to the Service Agreement. Have questions? Reply to your welcome email or reach out at hello@editmelo.com.<br><br>
      This proposal was prepared exclusively for <strong>${e.clientName}</strong> and is valid through <strong>${n}</strong>. Scope and pricing are subject to change if the proposal expires.
    </div>
  </div>
</body>
</html>`}function A(e){const o=e.signedAt?c(e.signedAt):"",n=e.signedAt?c(e.signedAt):"",i=d(e.totalAmount),t=e.depositAmount??Math.round(e.totalAmount*.5*100)/100,a=e.totalAmount-t,s=(e.scopeItems??[]).map(r=>`
    <tr><td>${r}</td></tr>
  `).join("");return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Service Agreement — ${e.projectName}</title>
  <style>${m}</style>
</head>
<body class="has-bar">
  <div class="print-bar no-print">
    <span>Edit Me Lo — Service Agreement</span>
    <button onclick="window.print()">Save / Print as PDF</button>
  </div>

  <div class="page">
    <div class="doc-header">
      <div class="brand-name">Edit Me Lo</div>
      <div class="brand-contact">
        <strong>www.editmelo.com</strong><br>
        hello@editmelo.com<br>
        Creative Studio &amp; Design Agency
      </div>
    </div>

    <h1 class="doc-title">Service Agreement</h1>
    <div class="doc-subtitle">${e.projectName}</div>

    <div class="meta-row">
      <div class="meta-item">
        <div class="meta-label">Client</div>
        <div class="meta-value">${e.clientName}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Service Provider</div>
        <div class="meta-value">Edit Me Lo, LLC</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Effective Date</div>
        <div class="meta-value">${n}</div>
      </div>
    </div>

    <p>
      This Service Agreement (<strong>"Agreement"</strong>) is entered into as of <strong>${n}</strong> by and between <strong>Edit Me Lo, LLC</strong>, a creative design studio (<strong>"Company"</strong>), and <strong>${e.clientName}</strong> (<strong>"Client"</strong>).
    </p>

    <h2 class="section-head">1. Scope of Services</h2>
    <p>
      The Company agrees to provide the Client with the services described in the Statement of Work attached hereto as <strong>Exhibit A</strong> (<strong>"Services"</strong>). All services are to be performed in a professional and workmanlike manner, consistent with industry standards. Any changes to the scope of services must be agreed upon in writing by both parties via a signed addendum.
    </p>

    <h2 class="section-head">2. Term &amp; Compensation</h2>
    <p>
      This Agreement shall commence on the effective date and shall continue until the completion of the Services described in Exhibit A, unless earlier terminated in accordance with this Agreement. The Client agrees to pay the Company the amounts specified in Exhibit A. A non-refundable deposit of <strong>${l(t)}</strong> (50% of the total project fee) is due upon signing this Agreement. The remaining balance of <strong>${l(a)}</strong> is due upon delivery of final files. Payment processing fees of 3% apply to all transactions.
    </p>

    <h2 class="section-head">3. Status of Parties</h2>
    <p>
      The Company is an independent contractor and not an employee of the Client. Nothing in this Agreement shall be construed to create a partnership, joint venture, agency, employment, or fiduciary relationship between the parties. The Company retains the right to perform services for other clients during the term of this Agreement, provided such work does not create a conflict of interest.
    </p>

    <h2 class="section-head">4. Confidentiality</h2>
    <p>
      Each party acknowledges that it may have access to confidential or proprietary information of the other party during the performance of this Agreement (<strong>"Confidential Information"</strong>). Each party agrees to hold the other's Confidential Information in strict confidence, not to disclose it to any third party without prior written consent, and to use it solely for the purposes of this Agreement. This obligation survives the termination of this Agreement for a period of two (2) years.
    </p>

    <h2 class="section-head">5. Trademarks &amp; Branding</h2>
    <p>
      The Client grants the Company a limited, non-exclusive, royalty-free license to use the Client's name, logo, and brand assets solely for the purpose of performing the Services under this Agreement. The Company may, with the Client's prior written consent, reference the Client as a portfolio case study or in its marketing materials.
    </p>

    <h2 class="section-head">6. Intellectual Property Rights</h2>
    <p>
      Upon receipt of full payment, the Company assigns to the Client all rights, title, and interest in and to the final deliverables created specifically for the Client under this Agreement. The Company retains ownership of all preliminary concepts, drafts, working files, and any underlying tools, frameworks, or pre-existing materials used in the creation of the deliverables. The Company retains the right to display the work in its portfolio.
    </p>

    <h2 class="section-head">7. Indemnification</h2>
    <p>
      The Client agrees to indemnify, defend, and hold harmless the Company, its owners, officers, employees, and agents from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) the Client's use of the deliverables; (b) any content or materials provided by the Client; or (c) the Client's breach of this Agreement. The Company agrees to indemnify the Client against claims arising solely from the Company's gross negligence or willful misconduct.
    </p>

    <h2 class="section-head">8. Warranty &amp; Disclaimer</h2>
    <p>
      The Company warrants that the Services will be performed in a professional and workmanlike manner. The Company does not warrant that the deliverables will achieve any specific business outcome or result. EXCEPT AS EXPRESSLY SET FORTH HEREIN, THE COMPANY MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
    </p>

    <h2 class="section-head">9. Revisions &amp; Approvals</h2>
    <p>
      The number of revision rounds included in this project is as specified in Exhibit A. Additional revisions beyond the included rounds will be quoted and billed separately. The Client's written approval (via the EML Portal or email) of any deliverable constitutes acceptance of that deliverable as complete and satisfactory. Once approved, changes to approved work will be treated as new scope.
    </p>

    <h2 class="section-head">10. Termination</h2>
    <p>
      Either party may terminate this Agreement with <strong>14 days' written notice</strong>. Upon termination by the Client, the Client shall pay for all work completed up to the date of termination, including any work in progress. The deposit is non-refundable under all circumstances. Upon termination by the Company for cause (e.g., Client's breach or non-payment), the Company may retain all amounts paid and is relieved of any further obligations.
    </p>

    <h2 class="section-head">11. Notices</h2>
    <p>
      All notices required or permitted under this Agreement shall be in writing and delivered via email to the addresses listed in this Agreement, or to such other addresses as either party may designate in writing. Notice is deemed given upon confirmation of receipt.
    </p>

    <h2 class="section-head">12. Governing Law</h2>
    <p>
      This Agreement shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law principles. Any disputes arising under this Agreement shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
    </p>

    <h2 class="section-head">13. Assignability</h2>
    <p>
      Neither party may assign this Agreement or any rights or obligations hereunder without the prior written consent of the other party, except that the Company may assign this Agreement in connection with a merger, acquisition, or sale of substantially all of its assets.
    </p>

    <h2 class="section-head">14. Subcontractors</h2>
    <p>
      The Company reserves the right to engage qualified subcontractors or freelancers to assist in the performance of the Services. The Company remains responsible for the quality of work delivered and ensures all subcontractors are bound by appropriate confidentiality obligations.
    </p>

    <h2 class="section-head">15. Entire Agreement</h2>
    <p>
      This Agreement, together with all Exhibits, constitutes the entire agreement between the parties with respect to its subject matter and supersedes all prior negotiations, representations, warranties, and understandings. No modification of this Agreement shall be effective unless in writing and signed by both parties.
    </p>

    <h2 class="section-head">16. Waiver</h2>
    <p>
      The failure of either party to enforce any provision of this Agreement shall not constitute a waiver of that party's right to enforce that provision or any other provision in the future.
    </p>

    <h2 class="section-head">17. Non-Solicitation</h2>
    <p>
      During the term of this Agreement and for a period of twelve (12) months following its termination, the Client agrees not to directly solicit, hire, or engage any employee, contractor, or subcontractor of the Company who was involved in the performance of Services under this Agreement without the Company's prior written consent.
    </p>

    <h2 class="section-head">18. Severability</h2>
    <p>
      If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect, and the invalid provision shall be modified to the minimum extent necessary to make it enforceable.
    </p>

    <h2 class="section-head">19. Uncontrollable Events</h2>
    <p>
      Neither party shall be liable for any delay or failure in performance resulting from causes beyond its reasonable control, including but not limited to acts of God, natural disasters, pandemic, government action, or internet outages. The affected party shall provide prompt written notice and use commercially reasonable efforts to resume performance.
    </p>

    <h2 class="section-head">20. Counterparts &amp; Electronic Signatures</h2>
    <p>
      This Agreement may be executed in counterparts, each of which shall constitute an original. Electronic signatures (including typed names as e-signatures) shall be deemed valid and binding to the same extent as original handwritten signatures pursuant to the Electronic Signatures in Global and National Commerce Act (ESIGN) and the Uniform Electronic Transactions Act (UETA).
    </p>

    <h2 class="section-head">21. Survival</h2>
    <p>
      The provisions of this Agreement relating to confidentiality, intellectual property, indemnification, payment obligations, and governing law shall survive the expiration or termination of this Agreement.
    </p>

    <h2 class="section-head">22. Authority to Sign</h2>
    <p>
      Each party represents and warrants that it has full legal authority to enter into this Agreement and that the individual signing on its behalf has been duly authorized to do so.
    </p>

    <!-- Signature Block -->
    <div class="sig-block">
      <p class="sig-block-title">Signatures</p>
      <div class="sig-row">
        <div class="sig-field">
          <p class="sig-label">Client Signature</p>
          <div class="sig-value">
            <span class="sig-cursive">${e.signatureText??""}</span>
          </div>
        </div>
        <div class="sig-field">
          <p class="sig-label">Date Signed</p>
          <div class="sig-value">
            <span class="sig-text">${o}</span>
          </div>
        </div>
      </div>
      <div class="sig-row">
        <div class="sig-field">
          <p class="sig-label">Client Name</p>
          <div class="sig-value">
            <span class="sig-text">${e.clientName}</span>
          </div>
        </div>
        <div class="sig-field">
          <p class="sig-label">Service Provider</p>
          <div class="sig-value">
            <span class="sig-text">Edit Me Lo, LLC</span>
          </div>
        </div>
      </div>
    </div>

    <div class="cert-footer">
      <strong>Electronic Signature Certification:</strong> This document was electronically signed by <strong>${e.clientName}</strong> on <strong>${o}</strong> via the Edit Me Lo Client Portal. The typed name above constitutes a legally binding electronic signature pursuant to the ESIGN Act (15 U.S.C. § 7001) and UETA. Document ID: <strong>${e.id}</strong>
    </div>
  </div>

  <!-- Exhibit A: Statement of Work -->
  <div class="page-break"></div>
  <div class="page">
    <div class="attachment-header">
      <h2>Exhibit A — Statement of Work</h2>
      <p>Attachment to Service Agreement for <strong>${e.projectName}</strong></p>
    </div>

    <div class="meta-row">
      <div class="meta-item">
        <div class="meta-label">Service</div>
        <div class="meta-value">${e.serviceTitle}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Package</div>
        <div class="meta-value">${e.packageTier??"Custom"}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Timeline</div>
        <div class="meta-value">${e.timeline}</div>
      </div>
    </div>

    <h2 class="section-head">Deliverables</h2>
    <table class="doc-table">
      <thead>
        <tr><th>Deliverable / Item</th></tr>
      </thead>
      <tbody>
        ${s||"<tr><td>As discussed and agreed</td></tr>"}
      </tbody>
    </table>

    ${e.notes?`<h2 class="section-head">Additional Notes</h2><p>${e.notes}</p>`:""}

    <h2 class="section-head">Investment &amp; Payment Terms</h2>
    <table class="doc-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${e.serviceTitle} — ${e.packageTier??""} Package</td>
          <td class="amount">${l(e.totalAmount)}</td>
        </tr>
        <tr>
          <td>Payment Processing Fee (3%)</td>
          <td class="amount">${l(i)}</td>
        </tr>
        <tr class="total-row">
          <td>Total Investment</td>
          <td class="amount">${l(e.totalAmount+i)}</td>
        </tr>
        <tr class="deposit-row">
          <td>50% Deposit (non-refundable, due upon signing)</td>
          <td class="amount">${l(t+d(t))}</td>
        </tr>
        <tr>
          <td>Remaining Balance (due upon final delivery)</td>
          <td class="amount">${l(a+d(a))}</td>
        </tr>
      </tbody>
    </table>

    <p style="font-size:9pt;color:#777;font-family:-apple-system,sans-serif;margin-top:8px;">
      This Statement of Work is incorporated by reference into the Service Agreement. All terms and conditions of the Agreement apply to the services described herein.
    </p>
  </div>
</body>
</html>`}function x(e){const o=e.signedAt?c(e.signedAt):"",n=e.sentAt?c(e.sentAt):"",i=(e.additionalItems??[]).map(t=>`
    <tr><td>${t}</td></tr>
  `).join("");return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Addendum — ${e.title}</title>
  <style>${m}</style>
</head>
<body class="has-bar">
  <div class="print-bar no-print">
    <span>Edit Me Lo — Project Addendum</span>
    <button onclick="window.print()">Save / Print as PDF</button>
  </div>

  <div class="page">
    <div class="doc-header">
      <div class="brand-name">Edit Me Lo</div>
      <div class="brand-contact">
        <strong>www.editmelo.com</strong><br>
        hello@editmelo.com<br>
        Creative Studio &amp; Design Agency
      </div>
    </div>

    <h1 class="doc-title">Project Addendum</h1>
    <div class="doc-subtitle">${e.title}</div>

    <div class="meta-row">
      <div class="meta-item">
        <div class="meta-label">Project</div>
        <div class="meta-value">${e.projectName}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Client</div>
        <div class="meta-value">${e.clientName}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Date Issued</div>
        <div class="meta-value">${n}</div>
      </div>
    </div>

    <p>
      This Addendum (<strong>"Addendum"</strong>) supplements and is incorporated into the existing Service Agreement between <strong>Edit Me Lo, LLC</strong> and <strong>${e.clientName}</strong>. All terms of the original Service Agreement remain in full force and effect.
    </p>

    <h2 class="section-head">Description of Changes</h2>
    <p>${e.description}</p>

    ${i?`
    <h2 class="section-head">Additional Deliverables</h2>
    <table class="doc-table">
      <thead><tr><th>Item</th></tr></thead>
      <tbody>${i}</tbody>
    </table>`:""}

    ${e.additionalCost>0?`
    <h2 class="section-head">Additional Investment</h2>
    <table class="doc-table">
      <thead>
        <tr><th>Description</th><th class="amount">Amount</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Additional work as described above</td>
          <td class="amount">${l(e.additionalCost)}</td>
        </tr>
        <tr>
          <td>Payment Processing Fee (3%)</td>
          <td class="amount">${l(d(e.additionalCost))}</td>
        </tr>
        <tr class="total-row">
          <td>Total Additional Cost</td>
          <td class="amount">${l(e.additionalCost+d(e.additionalCost))}</td>
        </tr>
      </tbody>
    </table>`:`
    <h2 class="section-head">Additional Investment</h2>
    <p>No additional cost associated with this addendum.</p>
    `}

    <div class="sig-block">
      <p class="sig-block-title">Signatures</p>
      <div class="sig-row">
        <div class="sig-field">
          <p class="sig-label">Client Signature</p>
          <div class="sig-value">
            <span class="sig-cursive">${e.signatureText??""}</span>
          </div>
        </div>
        <div class="sig-field">
          <p class="sig-label">Date Signed</p>
          <div class="sig-value">
            <span class="sig-text">${o}</span>
          </div>
        </div>
      </div>
      <div class="sig-row">
        <div class="sig-field">
          <p class="sig-label">Client Name</p>
          <div class="sig-value">
            <span class="sig-text">${e.clientName}</span>
          </div>
        </div>
        <div class="sig-field">
          <p class="sig-label">Service Provider</p>
          <div class="sig-value">
            <span class="sig-text">Edit Me Lo, LLC</span>
          </div>
        </div>
      </div>
    </div>

    <div class="cert-footer">
      <strong>Electronic Signature Certification:</strong> This addendum was electronically signed by <strong>${e.clientName}</strong> on <strong>${o}</strong> via the Edit Me Lo Client Portal. Document ID: <strong>${e.id}</strong>
    </div>
  </div>
</body>
</html>`}export{x as a,w as b,A as g,y as u};

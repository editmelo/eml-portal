import{z as a}from"./index-ze2urEtO.js";const c="https://hook.us2.make.com/6fwnol9s5zxubtz13c11k4ci60rk1x9o";async function s(e){try{const t=await fetch(c,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`Make webhook returned ${t.status}`);return!0}catch{return console.log("%c[Email — simulated]","color:#47C9F3;font-weight:bold",`
To: ${e.to_email}`,`
Subject: ${e.subject}`,`
`,e),!1}}const l={CLIENT:{standard:e=>`Hi ${e},

You've been invited to the Edit Me Lo Client Portal — your dedicated space to track your project, review designs, manage invoices, and communicate directly with your creative team.

Click the link below to create your account and get started. We're excited to work with you!`,warm:e=>`Hi ${e}!

We are SO excited to start this journey with you. Your Edit Me Lo portal is ready and waiting — it's your personal hub for everything related to your project. From checking in on progress to leaving feedback on designs, it's all right there.

Can't wait to create something amazing together! Click below to set up your account.`,brief:e=>`Hi ${e},

Your Edit Me Lo client portal is ready. Click the link below to create your account and access your project dashboard.`},DESIGNER:{standard:e=>`Hi ${e},

You've been invited to join the Edit Me Lo designer portal. This is where you'll manage your assigned projects, upload work for client review, track your earnings, and stay connected with the team.

Looking forward to collaborating with you — click below to set up your account!`,warm:e=>`Hi ${e}!

Welcome to the Edit Me Lo family! We're thrilled to have you on the team. Your designer portal is set up and ready — projects, client comms, earnings tracking, and more all in one place.

Click below to get started. Let's build something great together!`,brief:e=>`Hi ${e},

You've been invited to join Edit Me Lo as a designer. Click the link below to set up your portal account.`}};async function g({role:e,ownerName:t,email:o,companyName:n,message:i}){await s({to_name:t,to_email:o,subject:e==="DESIGNER"?"You're invited to join Edit Me Lo as a Designer":"You're invited to the Edit Me Lo Client Portal",company:n,role:e==="DESIGNER"?"Designer":"Client",message:i,portal_url:`${window.location.origin}/signup`}),a.success(`Invite sent to ${o}`,{icon:"✉️",style:{background:"#0d1f3c",color:"#e2e8f0",border:"1px solid #1e3a5f"}})}const d={new_message:{subject:e=>`New message from ${e.senderName}`,body:e=>`Hi ${e.recipientName},

${e.senderName} sent you a message on the Edit Me Lo portal:

"${e.preview}"

Log in to reply.`},new_note:{subject:e=>`New note on ${e.projectName}`,body:e=>`Hi ${e.recipientName},

${e.authorName} left a note on your project "${e.projectName}":

"${e.preview}"

Log in to view the full conversation.`},project_status_changed:{subject:e=>`Project update: ${e.projectName}`,body:e=>`Hi ${e.recipientName},

Your project "${e.projectName}" has moved to ${e.status}.

Log in to your portal to see the latest details.`},designer_assigned:{subject:e=>`You've been assigned to: ${e.projectName}`,body:e=>`Hi ${e.recipientName},

You've been assigned to the project "${e.projectName}". Log in to your designer portal to view the brief and get started.`},new_draft_uploaded:{subject:e=>`New designs ready for review — ${e.projectName}`,body:e=>`Hi ${e.recipientName},

Your designer has uploaded new drafts for "${e.projectName}" and they're ready for your review.

Log in to view the designs and leave feedback.`}};async function p(e,t,o){const n=d[e];if(!n||!t)return;const i=n.subject(o),r=n.body(o);await s({to_name:o.recipientName??t,to_email:t,subject:i,message:r,portal_url:window.location.origin}),a(`Email notification sent to ${t}`,{icon:"📧",style:{fontSize:"11px",background:"#1e293b",color:"#64748b",border:"1px solid #334155"},duration:2e3})}export{l as I,p as a,g as s};

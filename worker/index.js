const RESUME_TEXT = `
Senior Solution Architect | Data & Analytics | Cloud Architecture

Bangalore, India | [LinkedIn](https://www.linkedin.com/in/suhaskarnik/)

---

## Professional Summary

Data and analytics architect with 18 years of experience designing and delivering end-to-end analytical solutions across cloud and on-premises environments. Has owned the full lifecycle of analytical models in production — from architecture and deployment through monitoring and handover — and consistently translates unstructured business problems into actionable, re-deployable solutions. Experienced in communicating complex analytical decisions to senior executives and capable of operating independently across the full project lifecycle from design through delivery and governance.

---

## Certifications

- Microsoft Certified: Azure Solutions Architect Expert (AZ-305)
- AWS Certified Solutions Architect – Associate
- TOGAF Certified

---

## Core Competencies

**Analytics & Modelling**

- End-to-end analytical solution design, production ML model deployment and monitoring (data drift, prediction quality), PySpark / Spark SQL, Delta Lake, Python, SQL, Scikit-Learn, ARIMA, MLflow

**Cloud & Infrastructure**

- AWS (EKS, Databricks on AWS), Microsoft Azure (Data Lake, Data Factory, Databricks, Azure SQL, Event Hub, Entra ID), Terraform

**Data Governance & Management**

- Data sovereignty and residency design, policy-based access control, RBAC / ABAC modelling, OSDU API standards and compliance, RAID artefacts, architectural step-out records

**BI & Reporting**

- Power BI integration architecture: workspace design, row-level security, semantic / analytical model design

**Architecture & Delivery**

- Solution architecture, integration pattern design (API, ETL, streaming), vendor architecture review, cost trade-off analysis, Agile delivery, Architecture Review Boards, cost optimisation

**Stakeholder & Leadership**

- Executive-level presentations (GM/VP CIO steercos), cross-functional business–IT translation, vendor engagement (AWS, Microsoft, Databricks), architect onboarding and peer review

---

## Professional Experience

### Senior Solution Architect — Major Integrated Oil & Gas Company *(2015 – Present)*

**Subsurface Analytics Platform** *(Oct 2025 – Present)*

- Designed an AWS-hosted analytics platform catering for a complex data sourcing landscape spanning on-premises, private cloud, and public cloud sources
- Formulated a Databricks cost management strategy enabling per-asset cost allocation and driving correct usage behaviour across teams
- Designed a solution to share data securely with third parties
- Applied Spec Driven Development using OpenSpec for data engineering tasks

**OSDU Data Platform** *(Oct 2022 – Present)*

- Designed the solution architecture for an ecosystem of OSDU applications supporting subsurface data management, hosted on AWS EKS
- Conducted post-deployment monitoring covering data drift and prediction quality; transitioned operational ownership to another team while retaining accountability for issues
- Produced an enterprise integration playbook covering API, ETL, and streaming archetypes with gap analysis; presented tooling choices and integration options to steercos with multiple GM-level stakeholders
- Designed policy-based access control and coordinated policy promotion workflows; drove data sovereignty solutions with internal and OSDU community partners
- Contributed specifications and authored Architecture Decision Records (ADRs) for the OSDU Project & Workflow Services working group — an industry-wide initiative

**Asset Data Platform** *(Nov 2015 – Oct 2022)*

- Owned end-to-end solution design and architecture for a production analytics platform serving operational and maintenance business domains (safety, availability, cost)
- Drove migration of a critical Data Warehouse from on-premises SAP HANA to a fully Azure-native solution within one year, achieving significant reduction in TCO and time to market
- Led pivot from Azure Analysis Services to Databricks to enable self-service BI, managing cost and security trade-offs
- Designed the platform integration with Power BI: workspace structure across teams, row-level security model, and contributed to analytical/semantic model design
- Championed adoption of Delta Lake over Parquet early in the project lifecycle: ran proof-of-concept, built the business case, and secured management sign-off
- Ingested near-realtime sensor data at scale from Osisoft PI via Azure Event Hub
- Ran a PySpark / Spark SQL proof-of-concept to enable per-asset schemas for self-service analytics on a shared platform, with row-level security ensuring data isolation
- Made cost trade-off recommendations at architectural level (e.g. Azure SQL over Synapse based on data volumes and access patterns)
- Provided technical and team leadership for a 15+ member analytics and data warehousing team; team received VP CIO award
- Designed RBAC security models using Entra ID; applied STRIDE framework for security threat modelling

---

### Solutions Consultant — [Prior Employers] *(pre-2014)*

- Led requirements gathering, solution design, and technical team delivery for two client engagements: Northern Gas Networks (UK) and Philips (NL), each approximately one year in duration

---

## Education

**B.Tech in Information Technology** — Sathyabama University, Chennai, India *(2003)*

---

## Personal Projects & Open Source

- [MCPJungle](https://github.com/suhaskarnik/MCPJungle) — Open source MCP server registry; contributed Docker secrets support
- [foodhub-chatbot](https://github.com/suhaskarnik/foodhub-chatbot) — LangChain-powered chatbot with intent classification, guardrails, answer formatting, and Streamlit UI
- [smoldata](https://github.com/suhaskarnik/smoldata) — Experimentation with Hugging Face Smolagents agentic framework
- [gl-tourism](https://github.com/suhaskarnik/gl-tourism) — Scikit-Learn ML model with Streamlit UI and Dockerfile
- [k3s-homelab](https://github.com/suhaskarnik/k3s-homelab) — Terraform-managed K3s cluster on Proxmox
- [cicd-trunk](https://github.com/suhaskarnik/cicd-trunk) — Trunk-driven CI/CD pipeline to AWS Lambda using Terraform


`;

function corsHeaders(origin, allowedOrigins) {
	if (!allowedOrigins.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function verifyTurnstile(token, secret, clientIP) {
  try {
    const params = { secret, response: token };
    if (clientIP) params.remoteip = clientIP;
    const body = new URLSearchParams(params);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

async function checkIpRateLimit(kv, ip) {
  if (!ip) return true;
  try {
    const now = new Date();
    const hour = now.toISOString().slice(0, 13).replace("T", "-");
    const key = `ip:${ip}:hour:${hour}`;
    const current = parseInt((await kv.get(key)) || "0", 10);
    if (current >= 10) return false;
    await kv.put(key, String(current + 1), { expirationTtl: 7200 });
    return true;
  } catch (err) {
    console.error("checkIpRateLimit error:", err);
    return true;
  }
}

async function checkGlobalDailyCap(kv) {
  try {
    const day = new Date().toISOString().slice(0, 10); // "2026-04-27"
    const key = `global:day:${day}`;
    const current = parseInt((await kv.get(key)) || "0", 10);
    if (current >= 500) return false;
    await kv.put(key, String(current + 1), { expirationTtl: 90000 });
    return true;
  } catch (err) {
    console.error("checkGlobalDailyCap error:", err);
    return true;
  }
}

async function callGroq(apiKey, question) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that answers questions about Suhas Karnik's professional experience based solely on his resume below. Answer concisely and factually. If the question cannot be answered from the resume, say so politely — do not speculate or invent information.\n\n--- RESUME ---\n${RESUME_TEXT}\n--- END RESUME ---`,
          },
          { role: "user", content: question },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq error: ${res.status}`);
    const data = await res.json();
    const answer = data?.choices?.[0]?.message?.content;
    if (!answer) throw new Error("Groq returned no content");
    return answer;
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  async fetch(request, env) {
    if (!env.ALLOWED_ORIGIN) {
      return new Response(JSON.stringify({ error: "Worker misconfigured." }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const origin = request.headers.get("Origin") || "";
		const allowedOrigins = env.ALLOWED_ORIGIN.split(",").map(s => s.trim());
    const headers = corsHeaders(origin, allowedOrigins);


    if (request.method === "OPTIONS") {
      if (!headers) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (!headers) {
return new Response(JSON.stringify({ error: "Unable to verify request." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const clientIP = request.headers.get("CF-Connecting-IP") || null;

    // 1. Parse body
    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body." }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // 2. Turnstile
    const { turnstileToken, question } = payload;
    if (!turnstileToken) {
return new Response(JSON.stringify({ error: "Unable to verify request." }), {
        status: 403,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    const turnstileOk = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, clientIP);
    if (!turnstileOk) {
return new Response(JSON.stringify({ error: "Unable to verify request." }), {
        status: 403,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // 3. Input validation
    if (!question || typeof question !== "string" || question.trim().length === 0 || question.length > 500) {
      return new Response(JSON.stringify({ error: "Please enter a question (max 500 characters)." }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // 4. Per-IP rate limit
    const ipAllowed = await checkIpRateLimit(env.RATE_LIMIT_KV, clientIP);
    if (!ipAllowed) {
      return new Response(JSON.stringify({ error: "Too many requests — try again in an hour." }), {
        status: 429,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // 5. Global daily cap
    const globalAllowed = await checkGlobalDailyCap(env.RATE_LIMIT_KV);
    if (!globalAllowed) {
      return new Response(JSON.stringify({ error: "The assistant is unavailable for today. Check back tomorrow." }), {
        status: 503,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // 6. Groq API call
    let answer;
    try {
      answer = await callGroq(env.GROQ_API_KEY, question.trim());
    } catch {
      return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  },
};

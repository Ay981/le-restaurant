# Le Restaurant - Documentation

Welcome to the **Le Restaurant** documentation. This guide covers everything you need to set up, develop, deploy, and contribute to the project.

## Table of Contents

| Document | Description |
|----------|-------------|
| [Getting Started](./getting-started.md) | Installation, environment setup, and running the app locally |
| [Architecture](./architecture.md) | Tech stack, project structure, and design decisions |
| [Database Schema](./database-schema.md) | Tables, relationships, enums, RLS policies, and migrations |
| [API Reference](./api-reference.md) | Complete reference for all REST API endpoints |
| [Authentication & Roles](./authentication-and-roles.md) | Auth flow, user roles, admin promotion, and security |
| [Features](./features.md) | In-depth guide to ordering, payments, AI recommendations, and admin tools |
| [Deployment](./deployment.md) | Deploying to Vercel and configuring Supabase for production |
| [Contributing](./contributing.md) | Code conventions, branching strategy, and PR workflow |

## Quick Links

- **Stack:** Next.js 16 (App Router) &middot; React 19 &middot; TypeScript &middot; Tailwind CSS 4 &middot; Supabase
- **Live app:** Deployed on Vercel (see [Deployment](./deployment.md))
- **Source:** [GitHub Repository](https://github.com/Ay981/le-restaurant)

## Overview

Le Restaurant is a full-featured restaurant POS (Point of Sale) dashboard that supports:

- **Guest ordering** &mdash; browse the menu, build a cart, and check out without signing in
- **Customer accounts** &mdash; sign up for personalized order history and AI-powered dish suggestions
- **Payment verification** &mdash; upload bank transfer receipts for automated verification with replay protection
- **AI recommendations** &mdash; guided chatbot powered by Google Gemini with a rule-based fallback engine
- **Admin management** &mdash; create/edit dishes, manage categories, and track orders with status workflows
- **Staff support** &mdash; staff role for order management and status updates

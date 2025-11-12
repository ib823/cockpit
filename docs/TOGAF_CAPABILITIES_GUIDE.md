# TOGAF Business Capabilities Guide

## Overview
Business capabilities represent **what** the business does, not **how** it does it. They are stable over time and independent of organizational structure, processes, or technology.

## TOGAF Best Practices

### 1. **Capability Characteristics**
- **Stable**: Capabilities don't change frequently (unlike processes or technologies)
- **Business-focused**: Expressed in business terms, not technical jargon
- **Outcome-oriented**: Focus on what value is delivered
- **Independent**: Not tied to specific departments, systems, or processes
- **Hierarchical**: Can be decomposed into sub-capabilities (L1, L2, L3)

### 2. **Naming Conventions**
Use **noun-based** naming patterns:
- ✅ Good: "Customer Relationship Management", "Financial Planning & Analysis"
- ❌ Bad: "Manage Customers", "Plan Finances"

### 3. **Capability Levels**
- **Level 1**: High-level domains (e.g., "Finance & Accounting")
- **Level 2**: Functional capabilities (e.g., "Financial Planning & Analysis")
- **Level 3**: Specific capabilities (e.g., "Budget Planning", "Variance Analysis")

## Available Templates in the Tool

### 📊 Finance & Accounting
Core financial operations and reporting
- Financial Planning & Analysis
- Accounts Payable/Receivable Management
- General Ledger Management
- Financial Reporting & Compliance
- Treasury Management
- Tax Management
- Fixed Asset Management

### 👥 Human Capital Management
Workforce planning and talent management
- Workforce Planning
- Talent Acquisition & Recruitment
- Employee Onboarding
- Learning & Development
- Performance Management
- Compensation & Benefits Administration
- Workforce Analytics
- Employee Relations

### 🚚 Supply Chain Management
End-to-end supply chain operations
- Demand Planning
- Procurement & Sourcing
- Supplier Relationship Management
- Inventory Management
- Warehouse Management
- Order Fulfillment
- Logistics & Transportation
- Supply Chain Analytics

### 🤝 Customer Management
Customer-facing capabilities
- Customer Relationship Management
- Lead & Opportunity Management
- Quote & Proposal Management
- Order Management
- Customer Service & Support
- Customer Analytics
- Marketing Campaign Management
- Channel Partner Management

### 🎯 Product & Service Management
Product lifecycle and portfolio management
- Product Development & Innovation
- Product Portfolio Management
- Product Lifecycle Management
- Pricing & Profitability Management
- Quality Management
- Product Data Management

### 💻 IT Service Management
IT operations and service delivery
- IT Service Desk
- Incident & Problem Management
- Change & Release Management
- IT Asset Management
- Service Level Management
- IT Security Management
- Infrastructure & Operations
- Application Portfolio Management

### ⚠️ Risk & Compliance
Risk management and regulatory compliance
- Enterprise Risk Management
- Regulatory Compliance
- Internal Audit
- Data Privacy & Protection
- Business Continuity Management
- Fraud Detection & Prevention

### 🎯 Strategy & Governance
Strategic planning and enterprise governance
- Strategic Planning
- Portfolio & Program Management
- Enterprise Architecture
- Business Process Management
- Data Governance
- Organizational Change Management

## How to Use in the Architecture Tool

### 1. **Loading Templates**
1. Navigate to the Business Context tab
2. Click "Load TOGAF Templates" button
3. Select a capability domain card
4. All capabilities in that domain are added automatically
5. Categories are color-coded for easy identification

### 2. **Color Coding**
- 🟢 Finance & Accounting - Green
- 🟠 Human Capital Management - Orange
- 🔵 Supply Chain Management - Blue
- 🟣 Customer Management - Purple
- 🟡 Product & Service Management - Yellow
- 🔵 IT Service Management - Teal
- 🔴 Risk & Compliance - Red
- 🟢 Strategy & Governance - Light Green

### 3. **Customizing Capabilities**
- Click on any capability tag to edit the name
- Delete capabilities that don't apply to your project
- Add custom capabilities using "Add Custom Capability" button
- Mix and match from multiple templates

### 4. **Best Practices for Selection**
1. **Start with templates** - Use TOGAF templates as a starting point
2. **Customize** - Adapt to your organization's specific context
3. **Prioritize** - Focus on capabilities critical to your transformation
4. **Validate** - Review with business stakeholders for accuracy
5. **Link to gaps** - Use these as a basis for identifying capability gaps

## Example: SAP S/4HANA Implementation

For an SAP S/4HANA transformation, you might select:

**From Finance & Accounting:**
- Financial Planning & Analysis
- General Ledger Management
- Financial Reporting & Compliance
- Accounts Payable/Receivable Management

**From Supply Chain Management:**
- Procurement & Sourcing
- Inventory Management
- Order Fulfillment

**From Strategy & Governance:**
- Enterprise Architecture
- Business Process Management
- Organizational Change Management

## Integration with Architecture Diagrams

Capabilities selected here will:
1. Inform the **Current Business Landscape** (what exists today)
2. Drive the **Proposed Solution** design (what needs to be enhanced)
3. Appear in generated architecture diagrams
4. Help identify gaps between current and target state

## References

- [TOGAF Standard](https://www.opengroup.org/togaf)
- [TOGAF Business Architecture](https://pubs.opengroup.org/togaf-standard/business-architecture/)
- [Business Capability Modeling](https://www.opengroup.org/soa/source-book/busarch/p3.htm)

## Tips for Enterprise Architects

1. **Map capabilities to systems** - Document which applications support which capabilities
2. **Assess capability maturity** - Rate each capability (e.g., 1-5 scale)
3. **Identify gaps** - Compare current vs. required capabilities
4. **Plan investments** - Prioritize capability improvements based on business value
5. **Track evolution** - Monitor capability maturity over time

# Penetration Test Report

> **Purpose:** This template is designed for AI-assisted report
> generation. An AI agent can populate this report from Jira issues
> and/or Markdown finding files.

------------------------------------------------------------------------

# Report Metadata

  Field             Value
  ----------------- --------------------------------
{{metadata_table}}

------------------------------------------------------------------------

# Table of Contents

1.  Executive Summary
2.  Engagement Overview
3.  Assessment Methodology
4.  Scope
5.  Overall Risk Summary
6.  Findings Summary
7.  Detailed Findings
8.  Positive Security Observations
9.  Conclusion
10. Appendix

------------------------------------------------------------------------

# 1. Executive Summary

## Overview

{{executive_summary}}

Include:

-   Business context
-   Overall security posture
-   Highest business risks
-   Major attack paths
-   Overall assessment

## Risk Overview

  Severity                       Count
  --------------- --------------------
  Critical          {{critical_count}}
  High                  {{high_count}}
  Medium              {{medium_count}}
  Low                    {{low_count}}
  Informational         {{info_count}}

## Executive Recommendations

{{executive_recommendations}}

------------------------------------------------------------------------

# 2. Engagement Overview

## Objectives

{{engagement_objectives}}

## Rules of Engagement

{{rules_of_engagement}}

------------------------------------------------------------------------

# 3. Assessment Methodology

Reference methodology (OWASP, PTES, NIST, etc.)

## Activities Performed

-   Reconnaissance
-   Enumeration
-   Vulnerability Assessment
-   Exploitation
-   Post Exploitation (if applicable)
-   Validation

------------------------------------------------------------------------

# 4. Scope

## In Scope

{{in_scope}}

## Out of Scope

{{out_of_scope}}

------------------------------------------------------------------------

# 5. Overall Risk Summary

## Key Themes

{{risk_themes}}

## Attack Path Summary

{{attack_path_summary}}

------------------------------------------------------------------------

# 6. Findings Summary

  ID   Title   Severity   CVSS   Status
  ---- ------- ---------- ------ --------

{{findings_summary_table}}

------------------------------------------------------------------------

# 7. Detailed Findings

> Repeat the following section for every finding.

------------------------------------------------------------------------

{{detailed_findings}}

------------------------------------------------------------------------

# 8. Positive Security Observations

{{positive_findings}}

------------------------------------------------------------------------

# 9. Conclusion

{{conclusion}}

------------------------------------------------------------------------

# 10. Appendix

## Tools Used

{{tools_table}}

## Target Inventory

{{target_inventory_table}}

## Risk Rating Definition

  Severity        Description
  --------------- --------------------------------
  Critical        Immediate remediation required
  High            Significant business risk
  Medium          Moderate risk
  Low             Limited risk
  Informational   No immediate risk

------------------------------------------------------------------------

# AI Generation Notes

The AI agent should:

1.  Read all Jira issues and local Markdown findings.
2.  Merge duplicate findings.
3.  Generate executive summary based on overall risk.
4.  Produce the findings summary table.
5.  Populate one detailed finding section per issue.
6.  Preserve evidence exactly as recorded.
7.  Keep remediation actionable.
8.  Reference original Jira IDs for traceability.
9.  Sort findings by severity (Critical → Informational).
10. Generate consistent Markdown output suitable for Git version
    control.

---
marp: true
theme: default
style: |
    img[alt~="center"] {
      display: block;
      margin: 0 auto;
    }
_class: lead
paginate: true
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.svg')
header: 'Secure Programming and Software Development'
footer: '![height:50px](http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg) RTEU CE407 Week-2'
title: "CE407 Secure Programming Week-2"
author: "Author: Dr. Uğur CORUH"
date:
subtitle: "Development Environment Security and Software Development Processes"
geometry: "left=2.54cm,right=2.54cm,top=1.91cm,bottom=1.91cm"
titlepage: true
titlepage-color: "FFFFFF"
titlepage-text-color: "000000"
titlepage-rule-color: "CCCCCC"
titlepage-rule-height: 4
logo:
logo-width:
page-background:
page-background-opacity:
links-as-notes: true
lot: true
lof: true
listings-disable-line-numbers: true
listings-no-page-break: false
disable-header-and-footer: false
header-left:
header-center:
header-right:
footer-left: "© Dr. Uğur CORUH"
footer-center: "License: CC BY-NC-ND 4.0"
footer-right:
subparagraph: true
lang: en-US
math: katex
tags:
  - ce407-week-2
  - software-development
  - change-management
  - version-control
  - security
  - development-environment
ref_link: na
---

<!-- _backgroundColor: aquq -->

<!-- _color: orange -->

<!-- paginate: false -->

# CE407 Secure Programming

## Week-2

#### Development Environment Security and Software Development Processes

Download [PDF](pandoc_ce407-week-2.en_doc.pdf),[DOCX](pandoc_ce407-week-2.en_word.docx), [SLIDE](ce407-week-2.en_slide.pdf), [PPTX](ce407-week-2.en_slide.pptx)

<iframe width=700, height=500 frameBorder=0 src="../ce407-week-2.en_slide.html"></iframe>

---

### Outline

- Development Environment Security and Software Development Processes
- Software Development Process
  - Software Development Flow
  - Baseline the Configuration
  - Initiating and Classifying Changes
  - Approving and Releasing Changes
- Software Development Environments
  - Development Environment Security
  - Version Control Systems
  - Source Code Server Security
  - Office and Server Room Security

---

## **Software Development Flow and Change Management**

### 1. **Software Development Flow**

#### Theoretical Explanation:

Software development processes must be managed using structured workflows. Proper change management ensures the project's success. This typically involves version control systems, technical teams, and project management processes.

#### Application:

- **Task:** Start a simple software project and demonstrate how to manage change requests (RFC). Create an approval mechanism at each step and manage the project using a version control system.

---

### 2. **Baseline the Configuration**

#### Theoretical Explanation:

Baselining a configuration ensures that all changes after a particular version are traceable. This is a fundamental step in development and change management processes.

#### Application:

- **Task:** Create a GIT repository and baseline the initial configuration settings. Set up a structure to track all changes made from this version onwards.

---

### 3. **Initiate the Change**

#### Theoretical Explanation:

Change requests (RFCs) are made to add new features or fix bugs in the project. Before development begins, all requirements are defined and evaluated through technical meetings.

#### Application:

- **Task:** Create an RFC and simulate how it is communicated to the project team. Develop a scenario that shows how decisions are made through meetings and technical reviews.

---

### 4. **Classify the Change**

#### Theoretical Explanation:

Change requests are classified based on cost, time, and technical requirements. If there are no financial or technical obstacles, the product owner grants approval for the technical team to implement the change.

#### Application:

- **Task:** Review a change request and manage the process that shows how it is classified and approved based on specific criteria.

---

### 5. **Approve and Schedule the Change**

#### Theoretical Explanation:

Before development starts, the change request is approved, and a project plan is created. This plan includes sprints and task assignments.

#### Application:

- **Task:** Organize a sprint planning meeting and assign tasks according to the approved change request. Use project management tools (Jira, Trello, etc.) to organize this process.

---

### 6. **Release the Change**

#### Theoretical Explanation:

The developed change is pushed to the production environment after testing is complete. At this stage, it is ensured that the change has been applied successfully.

#### Application:

- **Task:** Pull the developed change from the version control system and release it to the production environment. Record the steps and results during the release process.

---

### 7. **Validate and Review the Change**

#### Theoretical Explanation:

After the change is released, it is validated to ensure it has been applied correctly and meets expectations. Both technical and user reviews are conducted.

#### Application:

- **Task:** Test the released change and gather user feedback. Verify whether the change meets the expectations.

---

## **Software Development Environments and Version Control Systems**

### 1. **Development Environments**

#### Theoretical Explanation:

Software development occurs across different environments: development, test, and production. Each environment requires different security measures and configurations.

#### Application:

- **Task:** Set up development and test environments. Create an application that demonstrates the different security configurations for each environment.

---

### 2. **Version Control Systems**

#### Theoretical Explanation:

Version control systems (GIT, SVN, etc.) are used to track software development processes and allow changes to be reverted if necessary. Every change is recorded, and versions can be switched as needed.

#### Application:

- **Task:** Manage a software development process using GIT. Switch between branches and revert a change.

---

### 3. **Development Site and Source Code Server Security**

#### Theoretical Explanation:

The physical and digital security of the development environment is critical. Securing source code servers and monitoring systems ensures the integrity of the software.

#### Application:

- **Task:** Demonstrate how to secure a source code server in a development environment. Set up encryption and access control systems practically.

---

### 4. **Development Office and Server Room Security**

#### Theoretical Explanation:

Server rooms and development computers must be secured with access control, encryption, and physical security measures to protect the software.

#### Application:

- **Task:** Simulate access control for a server room. Configure security software on development computers and take precautions against potential attacks.

---

## **Weekly Summary and Next Week**

### This Week:

- **Software Development Flow and Change Management**
- **Configuration Baseline and Change Approval**
- **Development Environments and Version Control Systems**
- **Physical and Digital Security**

### Next Week:

- **Data Security and Cryptography**
- **Secure Communication and Key Management**

---

$$
End-Of-Week-1
$$
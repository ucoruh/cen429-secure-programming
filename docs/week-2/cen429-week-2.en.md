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
footer: '![height:50px](http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg) RTEU CEN429 Week-2'
title: "CEN429 Secure Programming Week-2"
author: "Author: Dr. Uğur CORUH"
date:
subtitle: "Development Environment Security and Software Development Processes"
geometry: "left=2.54cm,right=2.54cm,top=1.91cm,bottom=1.91cm"
titlepage: true
titlepage-color: "FFFFFF"
titlepage-text-color: "000000"
titlepage-rule-color: "CCCCCC"
titlepage-rule-height: 4
logo: "http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg"
logo-width: 100 
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
  - cen429-week-2
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

# CEN429 Secure Programming

## Week-2

#### Development Environment Security and Software Development Processes

Download [PDF](cen429-week-2.en_doc.pdf), [DOCX](cen429-week-2.en_word.docx), [SLIDE](cen429-week-2.en_slide.pdf), [PPTX](cen429-week-2.en_slide.pptx)

<iframe width=700, height=500 frameBorder=0 src="../cen429-week-2.en_slide.html"></iframe>

---

### Outline

- Development Environment Security and Software Development Processes

- Software Development Process

  - Software Development Flow

  - Configuration Baseline

  - Initiating and Classifying Changes

  - Approving and Releasing Changes

- Software Development Environments

  - Development Environment Security

  - Version Control Systems

  - Source Code Server Security

  - Server Room and Development Computer Security

---

## **Software Development Flow and Change Management**

### 1. **Software Development Flow**

#### Theoretical Explanation:

Software development processes must be controlled through specific flows. Managing changes effectively ensures the success of the project. This flow typically involves version control systems, technical teams, and project management processes.

#### Application:

- **Application:** Start a simple software project and create a process showing how to manage change requests (RFC). Set up an approval mechanism at every step and manage the project through a version control system.

---

### 2. **Configuration Baseline**

#### Theoretical Explanation:

Configuration baseline involves defining a specific version of a product or system, ensuring that all changes from this version onward can be tracked. This is a critical step in the development and change management processes.

#### Application:

- **Application:** Create a GIT repository and set up the initial configuration baseline. Establish a structure where all subsequent changes are traceable.

---

### 3. **Initiating a Change**

#### Theoretical Explanation:

Change requests (RFC) are made for adding new features or fixing bugs in the project. This process involves defining all requirements and conducting technical meetings before development begins.

#### Application:

- **Application:** Create a change request (RFC) and simulate how this request is communicated to the project team. Show a scenario where decisions are made through meetings and technical reviews.

---

### 4. **Classifying the Change**

#### Theoretical Explanation:

Change requests are classified based on cost, time, and technical requirements. If there are no financial or technical barriers, the product owner approves the request for development by the technical team.

#### Application:

- **Application:** Review a change request and manage the process of how it is classified and approved based on specific conditions.

---

### 5. **Approving and Scheduling the Change**

#### Theoretical Explanation:

Before starting development, the change request is approved, and a project plan is created. This plan includes sprints and task assignments.

#### Application:

- **Application:** Organize a sprint planning meeting and assign tasks according to the change request. Use planning tools (Jira, Trello, etc.) to structure the process.

---

### 6. **Releasing the Change**

#### Theoretical Explanation:

The developed change is deployed to production after testing is completed. This step ensures that the change is implemented successfully.

#### Application:

- **Application:** Pull a developed change from the version control system and deploy it to the production environment. Record the steps and test results during the release process.

---

### 7. **Validating and Reviewing the Change**

#### Theoretical Explanation:

After the change is released, it is validated to ensure it has been implemented correctly and meets expectations. Technical and user reviews are conducted.

#### Application:

- **Application:** Test the released change and gather user feedback. Verify whether the change meets expectations.

---

## **Software Development Environments and Source Code Version Control System**

### 1. **Development Environments**

#### Theoretical Explanation:

Software development occurs across different environments: development, testing, and production. Each environment requires different security measures and configurations.

#### Application:

- **Application:** Set up development and testing environments. Develop an application that demonstrates different security configurations for each environment.

---

### 2. **Version Control Systems**

#### Theoretical Explanation:

Version control systems (Git, SVN, etc.) are used to track software development processes and revert changes when necessary. Each change is recorded, and developers can switch between versions.

#### Application:

- **Application:** Manage a software development process using GIT. Switch between branches and revert a change.

---

### 3. **Development Site and Source Code Server Security**

#### Theoretical Explanation:

The physical and digital security of the development environment is crucial. Protecting source code servers and monitoring systems ensures the integrity of the software.

#### Application:

- **Application:** Demonstrate how to secure a source code server in a development environment. Set up encryption and access control systems.

---

### 4. **Development Office and Server Room Security**

#### Theoretical Explanation:

Server rooms and development computers must be protected with security measures to ensure the security of the software. Access controls, encryption, and physical security are part of this process.

#### Application:

- **Application:** Simulate access controls for a server room. Configure security software on development computers and take precautions against potential attacks.

---

## **Summary of the Week and Next Week**

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
End-Of-Week-2
$$

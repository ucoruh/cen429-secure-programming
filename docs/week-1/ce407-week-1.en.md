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
header: 'CE407 Secure Programming Syllabus'
footer: '![height:50px](http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg) RTEU CE407 Week-1'
title: "CE407 Secure Programming Week-1"
author: "Author: Asst. Prof. Dr. Uğur CORUH"
date:
subtitle: "Introduction to Secure Programming and Computer Viruses"
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
footer-left: "© Dr. Ugur CORUH"
footer-center: "License: CC BY-NC-ND 4.0"
footer-right:
subparagraph: true
lang: en-US
math: katex
charset: "utf-8"
tags:
  - ce407-week-1
  - secure-programming
  - computer-viruses
  - code-splitting
  - code-verification
  - protocol-monitoring
  - virus-countermeasures
  - application-protection-plan
ref_link: na
---

<!-- _backgroundColor: aquq -->

<!-- _color: orange -->

<!-- paginate: false -->

# CE407 Secure Programming

## Week-1

#### Course Plan and Communication, Secure Programming, and Computer Viruses

Download [PDF](ce407-week-1.en_doc.pdf), [DOCX](ce407-week-1.en_word.docx), [SLIDE](ce407-week-1.en_slide.pdf), [PPTX](ce407-week-1.en_slide.pptx)

<iframe width=700, height=500 frameBorder=0 src="../ce407-week-1.en_slide.html"></iframe>

---

### Outline

- Secure Programming and Computer Viruses
- Application Protection Plan
  - Code Splitting    
  - Code Verification
  - Timing    
  - Protocol Monitoring
- Computer Viruses
  - Virus Characteristics
  - Virus Types
  - Virus Countermeasures
- Attack Trees and Security Models
- Attack Methods
- Secure Communication Goals

---

## **Application Protection Plan**

### 1. **Code Splitting**

#### Theoretical Explanation:

Code splitting refers to moving operations performed in an untrusted environment to a trusted one, thus minimizing security vulnerabilities.

#### Practical Application:

- **Task:** Implement a system where encryption is handled on the server instead of the client in a client-server model. This method ensures that critical operations are executed in a secure environment.

---

### 2. **Code Verification**

#### Theoretical Explanation:

We verify that a system performs as expected by asking an untrusted device or site, "Are you running the correct code?"

#### Practical Application:

- **Task:** Develop a system that checks whether an application can solve specific mathematical problems correctly and quickly during runtime. The system will cease operations if it cannot prove its correctness.

---

### 3. **Timing**

#### Theoretical Explanation:

In an untrusted system, a computational challenge is set up and expected to be solved within a certain timeframe. This technique prevents attackers from having enough time for analysis.

#### Practical Application:

- **Task:** Create a "Time-Based Question-Answer" application. If no response is received within the specified time, terminate the session.

---

### 4. **Protocol Monitoring**

#### Theoretical Explanation:

By monitoring protocol flows during data transfer, we can detect potential security vulnerabilities or malicious activities.

#### Practical Application:

- **Task:** Set up a logging system that monitors HTTP requests on a web server. Block users when suspicious requests are detected.

---

## **Computer Viruses**

### 1. **Virus Characteristics**

- **Dormant State:** A virus may remain inactive for a while, avoiding detection.
- **Propagation:** It spreads to new files or systems.
- **Triggering:** An event determines when the virus will activate.
- **Action:** The virus performs a harmful task, often called a "payload."

#### Practical Application:

- **Task:** Create a simulation where the virus stays dormant and activates on a specific date to delete a file.

---

### 2. **Virus Types**

- **Program/File Virus:** Infects program files.
- **Macro Virus:** Infects Word/Excel documents and executes when the document is opened.
- **Boot Sector Virus:** Infects the boot sector of a hard drive, activating when the computer starts.

#### Practical Application:

- **Task:** Create a simulation showing how different virus types work. Each type should be triggered by different events.

---

### 3. **Virus Countermeasures**

- **Signature-Based Detection:** Detects viruses based on known code snippets.
- **Encryption:** Viruses can encrypt their code to evade signature-based detection.

#### Practical Application:

- **Task:** Create a simulation of an encrypted virus. The virus's code should be encrypted with a different key each time it is executed.

---

## **Security Models and Attack Trees**

### 1. **What is an Attack Tree?**

An attack tree helps us understand the strategies an attacker might use to reach a goal. This model visualizes vulnerabilities, aiding in the development of effective defenses.

#### Practical Application:

- **Task:** Build a simple attack tree. For example, model the steps from an SQL injection in a web application to gaining access to the database.

---

### 2. **Cost Modeling**

Each step in an attack has a cost. These costs can be calculated to make it harder for an attacker to achieve their goal. In an attack tree, costs are assigned to each node, and the least costly path is calculated.

#### Practical Application:

- **Task:** Create a simulation that calculates the cost of each step in an attack tree. Simulate reaching the goal with the lowest cost.

---

## **Attack Methods**

### 1. **Dynamic Analysis**

This helps understand which parts of a program are triggered during execution and how the system behaves based on inputs.

#### Practical Application:

- **Task:** Develop a tracker that monitors which functions of software are called during runtime and what inputs trigger these functions.

---

### 2. **Static Analysis**

This involves analyzing the source code or compiled version of a program. This analysis helps identify potential security vulnerabilities.

#### Practical Application:

- **Task:** Use a disassembler to analyze the compiled code of a simple program and identify weaknesses.

---

### 3. **Editing Phase**

After understanding the internal workings of software, an attacker may edit the program to disable license checks or remove restrictions.

#### Practical Application:

- **Task:** Edit a program's binary to bypass a license check. Track which restrictions are lifted.

---

## **Secure Communication Goals**

- **Mutual Authentication:** Both parties in a communication verify each other.
- **Key Revocation:** Revocation of invalid keys.
- **High Performance:** Speed and low latency are essential for secure communication.

#### Practical Application:

- **Task:** Create a simple authentication protocol where both parties mutually verify each other.

---

## **Week Summary and Next Week**

### This Week:

- **Application Protection Plan**
- **Computer Viruses and Types**
- **Attack Trees and Security Models**
- **Attack Methods and Secure Communication Goals**

### Next Week:

- **Data Security**
- **Cryptographic Techniques**
- **Applied Encryption**

---

$$
End-Of-Week-1
$$

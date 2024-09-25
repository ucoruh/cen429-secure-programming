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
header: 'Secure Programming and Security Certificates'
footer: '![height:50px](http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg) RTEU CE407 Week-11'
title: "CE407 Secure Programming Week-11"
author: "Author: Dr. Uğur CORUH"
date:
subtitle: "Security Certificates and Penetration Testing Plans"
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
  - ce407-week-11
  - security-certificates
  - penetration-testing
  - security
ref_link: na
---

<!-- _backgroundColor: aquq -->

<!-- _color: orange -->

<!-- paginate: false -->

# CE407 Secure Programming

## Week-11

#### Security Certificates and Penetration Testing Plans

Download [PDF](ce407-week-11.tr_doc.pdf), [DOCX](ce407-week-11.tr_word.docx), [SLIDE](ce407-week-11.tr_slide.pdf), [PPTX](ce407-week-11.tr_slide.pptx)

<iframe width=700, height=500 frameBorder=0 src="../ce407-week-11.tr_slide.html"></iframe>

---

### Outline

- Importance of Security Certificates
- Penetration Testing Plans and Tools
- Certification Processes and Relationships

---

### **Week-11: Security Certificates and Penetration Testing Plans**

The goal of this week is to learn the importance of security certifications, the standards used, and how penetration testing (PenTest) processes are planned. Security certificates demonstrate the compliance of software and hardware with international security standards, while penetration tests help identify security vulnerabilities and analyze potential threats.

---

#### **1. Importance of Security Certificates**

**Theoretical Explanation:** Security certificates indicate that a system or product meets certain security standards. Certificates usually provide assurance to users that a product has undergone specific security testing.

- **Why Important?**
  - Provides reliability.
  - Shows compliance with international standards.
  - Meets regulatory and legal requirements.
  - Increases product security level.
  - Instills confidence in users and customers.

**Application Examples:**

1. Analyzing why a system requires a security certificate.
2. Examining the effects of security certificates on commercial products.

---

#### **2. Common Security Certificates and Standards**

**Theoretical Explanation:** Many security standards and certifications are used to ensure the security of hardware and software products. These standards guide how products should be tested and certified.

- **ETSI (European Telecommunications Standards Institute):** Establishes standards for telecommunications and network security.
- **EMV (Europay, MasterCard, Visa):** A standard used to secure card-based payment systems.
- **GSMA:** Security standards for mobile devices and networks.
- **ISO/IEC 27001:** Information security management systems standard.
- **PCI DSS (Payment Card Industry Data Security Standard):** A standard used to secure payment card information.

**Application Examples:**

1. Creating a network security plan based on ETSI standards.
2. Exploring how PCI DSS compliance is ensured for a payment system.

---

#### **3. EAL (Evaluation Assurance Level) Certification**

**Theoretical Explanation:** EAL (Evaluation Assurance Level) indicates the degree to which a product meets certain security requirements. It provides security assurance at various levels (from EAL1 to EAL7).

- **EAL Levels:**
  - **EAL1:** Functionally tested.
  - **EAL2:** Structurally tested.
  - **EAL3:** Methodically tested and checked.
  - **EAL4:** Design reviewed and methodically tested.
  - **EAL5:** High assurance, semantically analyzed.
  - **EAL6 and EAL7:** Extremely high security level, mathematically proven.

**Application Examples:**

1. Investigating how the EAL certification process works.
2. Assessing the security of a system based on EAL levels.

---

#### **4. Penetration Testing (PenTest) Plans**

**Theoretical Explanation:** Penetration testing simulates attacks to identify vulnerabilities and security weaknesses in a system. Penetration testing plans include the areas to be tested, methodology, objectives, and process.

- **Why Conduct Penetration Testing?**
  - To identify security vulnerabilities.
  - To test the system against real-world attacks.
  - To strengthen defense mechanisms by identifying weaknesses.
  - To proactively improve system security.

**PenTest Process Steps:**

1. **Reconnaissance:** Gathering information about the system.
2. **Scanning:** Identifying open ports, services, and vulnerabilities.
3. **Exploitation:** Exploiting identified vulnerabilities to gain access.
4. **Privilege Escalation:** Gaining administrative privileges within the system.
5. **Maintaining Access:** Making the access permanent.
6. **Evidence Collection:** Documenting the discovered vulnerabilities.

**Application Examples:**

1. Creating a penetration testing plan for a web application.
2. Simulating real-world attacks to analyze the security weaknesses of a system.

---

#### **5. Penetration Testing Methods**

**Theoretical Explanation:** Penetration testing methods vary depending on the type of system and attack objectives. Common testing methods include:

- **Whitebox Testing:** The tester has knowledge of the system's internal structure and source code.
- **Blackbox Testing:** The tester has no prior knowledge of the system. Attacks are carried out from the outside.
- **Graybox Testing:** The tester has partial knowledge of the system. For example, they may have information about the application structure or user roles.

**Application Examples:**

1. Analyzing the differences between whitebox and blackbox testing.
2. Conducting graybox testing on a system and reporting the results.

---

#### **6. Penetration Testing Tools**

**Theoretical Explanation:** Various tools are used during penetration testing to analyze system vulnerabilities. These tools are chosen based on the scope and objectives of the test.

- **Nessus:** A popular tool used for vulnerability scanning.
- **Metasploit:** A framework used for exploiting vulnerabilities and testing weaknesses.
- **Wireshark:** A tool used to monitor and analyze network traffic.
- **Burp Suite:** A tool used for security testing of web applications.
- **OWASP ZAP:** An open-source tool used to detect security vulnerabilities in web applications.

**Application Examples:**

1. Scanning a system for security vulnerabilities using **Nessus**.
2. Exploiting a security vulnerability using **Metasploit** and analyzing the results.

---

#### **7. The Relationship Between Penetration Testing and Certification**

**Theoretical Explanation:** Penetration testing results play a crucial role in the security certification process of a system. Certification bodies often consider penetration test results to verify the security of a system.

- **How Are They Related?**
  - PenTest results are included in the certification process, proving the security level.
  - Specific tests must be passed successfully to obtain a security certificate.
  - Regular penetration tests are conducted to ensure certification compliance.

**Application Examples:**

1. Analyzing how penetration test results can be integrated into the certification process.
2. Preparing a security testing plan in line with certification requirements.

---

### **Conclusion**

This week, we examined the impact of security certifications and penetration testing on system security. Security certificates demonstrate compliance with international standards, while penetration tests uncover vulnerabilities and improve the security of a system. These two processes work together to enhance the security level of software and hardware products.

---

$$
End-Of-Week-11
$$

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
header: 'Secure Programming and Runtime Application Self-Protection (RASP)'
footer: '![height:50px](http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg) RTEU CEN429 Week-6'
title: "CEN429 Secure Programming Week-6"
author: "Author: Dr. Öğr. Üyesi Uğur CORUH"
date:
subtitle: "RASP Techniques for Java"
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
  - cen429-week-6
  - rasp
  - java
  - runtime-application-self-protection
ref_link: na
---

<!-- _backgroundColor: aquq -->

<!-- _color: orange -->

<!-- paginate: false -->

# CEN429 Secure Programming

## Week-6

#### RASP Techniques for Java

Download [PDF](cen429-week-6.en_doc.pdf), [DOCX](cen429-week-6.en_word.docx), [SLIDE](cen429-week-6.en_slide.pdf), [PPTX](cen429-week-6.en_slide.pptx)

<iframe width=700, height=500 frameBorder=0 src="../cen429-week-6.en_slide.html"></iframe>

---

### Outline

- What is RASP (Runtime Application Self-Protection)?
- RASP Techniques for Java
- Emulator, Root, and Debug Mode Detection
- Security Libraries and SSL Pinning

---

## **Week-6: RASP (Runtime Application Self-Protection) in Java**

---

RASP (Runtime Application Self-Protection) for Java applications consists of techniques that ensure security during runtime. This week, we will explore RASP strategies for Java-based applications. Applications, especially mobile ones, must be able to protect themselves from various threats during runtime. The following topics cover techniques used for RASP in Java.

---

#### **1. Emulator Detection**

**Theoretical Explanation:** Emulators are tools that attackers can use to analyze an application and discover vulnerabilities. Emulator detection allows an application to determine whether it is running in an emulated environment. Specific detection mechanisms can be applied for popular emulators like Qemu.

**Source and Application:**

- Example for detecting Qemu ARM Emulator: [Anti Emulator for Qemu ARM](https://github.com/strazzere/anti-emulator/blob/master/AntiEmulator/jni/anti.c)
- Detecting emulator environments and altering application behavior during runtime.

---

#### **2. Debug Mode Detection**

**Theoretical Explanation:** Running an application in debug mode provides an opportunity for malicious individuals to analyze the application. Detecting whether the application is in debug mode and preventing it from functioning in this mode enhances security.

**Application Examples:**

1. Adding code snippets that check whether the application is in debug mode during runtime.
2. Terminating or altering the application’s behavior when it is running in debug mode.

---

#### **3. Debugger Attach Detection**

**Theoretical Explanation:** Attaching a debugger to an application allows it to be monitored and analyzed. Debugger detection checks whether the application has been attached to a debugger during runtime and reacts accordingly.

**Application Examples:**

1. Ensuring that the application closes or alters its behavior when a debugger is detected.
2. Implementing security mechanisms that detect debugger attachment.

---

#### **4. RootBeer Implementation**

**Theoretical Explanation:** RootBeer is a library that checks whether Android devices are rooted. Rooted devices can pose security risks for applications. Using RootBeer, the detection of rooted devices can be performed.

**Application Examples:**

1. Detecting whether a device is rooted using RootBeer.
2. Preventing or limiting the application’s functionality on rooted devices.

---

#### **5. Root Detection with AndroidSecurityManager**

**Theoretical Explanation:** AndroidSecurityManager is a security manager that provides information about the security status of Android devices. It ensures that rooted devices are detected and prevents the application from running on such devices.

**Application Examples:**

1. Performing root detection using AndroidSecurityManager.
2. Disabling certain features on rooted devices.

---

#### **6. SafetyNet Implementation**

**Theoretical Explanation:** Google SafetyNet is an API used to assess the security status of a device. Applications can check the device's security integrity using SafetyNet and respond when security breaches are detected.

**Application Examples:**

1. Using the SafetyNet API to verify the device’s security integrity.
2. Altering or terminating the application's behavior when security violations are detected.

---

#### **7. Checksum Control of Used Native Libraries**

**Theoretical Explanation:** Verifying the checksum values of native libraries used by an application allows us to determine whether these libraries have been tampered with. This is an important way to maintain the security of the application.

**Application Examples:**

1. Checking the checksum values of the libraries used during runtime.
2. Terminating or altering the application’s behavior if a library modification is detected.

---

#### **8. Tamper Device Detection**

**Theoretical Explanation:** Detecting whether the device or application has been tampered with helps protect the application against security breaches. Tamper detection identifies any modifications made to the device or application.

**Application Examples:**

1. Detecting whether the device or application has been tampered with.
2. Halting or limiting the application’s functionality when tampering is detected.

---

#### **9. SSL Pinning and WebView SSL Pinning**

**Theoretical Explanation:** SSL Pinning ensures that the application securely connects to a specific server. Implementing SSL pinning on WebView prevents users from connecting to fake servers.

**Application Examples:**

1. Implementing SSL pinning in WebView to verify the server’s identity.
2. Terminating the connection if an incorrect server is detected.

---

#### **10. Server Certificate Check**

**Theoretical Explanation:** Checking the validity of the server certificate when the application connects to a server prevents connections to fake servers. This is crucial for protecting against man-in-the-middle attacks.

**Application Examples:**

1. Verifying the server certificate during runtime.
2. Terminating the connection when an invalid certificate is detected.

---

#### **11. Device and Version Binding**

**Theoretical Explanation:** Device binding ensures that the application runs on a specific device and prevents it from running on other devices. Version binding ensures that the application is running on a specific version.

**Application Examples:**

1. Implementing device binding to ensure the application only runs on a designated device.
2. Implementing version binding to ensure the application runs only on specific versions.

---

#### **12. Consumer Verification**

**Theoretical Explanation:** Verifying that the application is being used by a legitimate user helps prevent fake users and automated processes. This verification process ensures the identity of the consumer.

**Application Examples:**

1. Using security tests and algorithms for consumer verification.
2. Applying access restrictions for unverified users.

---

$$
End-of-Week-6
$$

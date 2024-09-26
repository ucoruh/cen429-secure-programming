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
header: 'Secure Programming and Encryption Methods'
footer: '![height:50px](http://erdogan.edu.tr/Images/Uploads/MyContents/L_379-20170718142719217230.jpg) RTEU CEN429 Week-9'
title: "CEN429 Secure Programming Week-9"
author: "Dr. Uğur CORUH"
date:
subtitle: "Certificates and Encryption Methods"
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
  - cen429-week-9
  - certificates
  - encryption
  - symmetric-encryption
  - asymmetric-encryption
ref_link: na
---

<!-- _backgroundColor: aquq -->

<!-- _color: orange -->

<!-- paginate: false -->

# CEN429 Secure Programming

## Week-9

#### Certificates and Encryption Methods

---

Download 

- [PDF](pandoc_cen429-week-9.pdf)
- [DOC](pandoc_cen429-week-9.docx)
- [SLIDE](cen429-week-9.pdf)
- [PPTX](cen429-week-9.pptx)

---

<iframe width=700, height=500 frameBorder=0 src="../cen429-week-9.html"></iframe>

---

### Outline

- Certificates and Encryption Methods
- Symmetric and Asymmetric Encryption
- Digital Signatures and Certificate Management

---

### **Week-9: Certificates and Encryption Methods**

This week, we will examine the fundamental principles of encryption methods and certificates used in software security and communication. We will explore both symmetric and asymmetric encryption algorithms, how digital certificates work, and how they contribute to application security.

---

#### **1. Basics of Encryption Methods**

**Theoretical Explanation:** Encryption is a technique used to protect data confidentiality and prevent unauthorized access. Encryption methods are divided into two main categories: symmetric and asymmetric.

- **Symmetric Encryption:** The same key is used for both encryption and decryption. Example algorithms: AES, DES.
- **Asymmetric Encryption:** Two different keys are used. One key is for encryption, the other for decryption. Example algorithms: RSA, ECC.

---

#### **2. Symmetric Encryption Methods**

**Theoretical Explanation:** Symmetric encryption is advantageous in terms of speed and efficiency compared to asymmetric encryption, but it has the key-sharing problem.

- **AES (Advanced Encryption Standard):** A widely used and highly secure block encryption algorithm. It works with key lengths of 128, 192, or 256 bits.
- **DES (Data Encryption Standard):** An older algorithm that is no longer recommended due to security vulnerabilities.
- **Block Encryption and Modes:** Block encryption encrypts data in fixed-length blocks. Example modes: ECB (Electronic Codebook), CBC (Cipher Block Chaining).

**Application Examples:**

1. Encrypting and decrypting text using **AES**.
2. Encrypting and decrypting a file using CBC mode.

---

#### **3. Asymmetric Encryption Methods**

**Theoretical Explanation:** Asymmetric encryption involves two keys: a public key and a private key. Data is encrypted with the public key and can only be decrypted with the private key.

- **RSA (Rivest-Shamir-Adleman):** A widely used asymmetric encryption algorithm. It is based on large prime numbers and is used for both encryption and digital signatures.
- **ECC (Elliptic Curve Cryptography):** A more secure asymmetric encryption algorithm compared to RSA, with smaller key sizes.

**Application Examples:**

1. Encrypting and decrypting text using **RSA**.
2. Creating and verifying a digital signature using **ECC**.

---

#### **4. Hybrid Encryption**

**Theoretical Explanation:** Hybrid encryption uses both symmetric and asymmetric encryption. Symmetric keys are securely shared using asymmetric encryption, and then the data is encrypted with the symmetric key.

- **Application:** Used in many secure communication protocols, such as email and HTTPS.

**Application Examples:**

1. Encrypting a symmetric key asymmetrically and then securing data with symmetric encryption.
2. Secure data exchange between two devices using hybrid encryption.

---

#### **5. Digital Certificates and Certificate Authorities (CAs)**

**Theoretical Explanation:** Digital certificates can be defined as electronic documents that verify the identity of a person or organization. These certificates are typically signed by a Certificate Authority (CA) and securely transmitted to users.

- **X.509 Certificate:** The most commonly used certificate type.
- **Certificate Authority (CA):** Trusted authorities that digitally sign certificates.
- **Certificate Chain:** A structure in which certificates are linked in a verifiable hierarchy. Each certificate is signed by a higher authority.

**Application Examples:**

1. Creating and installing an **SSL/TLS** certificate for a web server.
2. Verifying **X.509** certificates and inspecting the security chain.

---

#### **6. Digital Signatures**

**Theoretical Explanation:** Digital signatures are used to verify the identity of data and check whether it has been altered. The signature is created by calculating a hash of a message and encrypting the hash with a private key.

- **Verification of the Signature:** The signature can be verified using the public key.
- **Applications:** Email, software distribution, digital contracts.

**Application Examples:**

1. Creating and verifying a **digital signature** for a file.
2. Signing and verifying a message using **PGP/GPG**.

---

#### **7. Certificate-Based Authentication**

**Theoretical Explanation:** Certificates are used for authentication, especially in secure communication between servers. Both the client and server validate each other's certificates to establish a secure communication channel.

- **SSL/TLS:** A protocol used for secure communication between web browsers and servers.
- **Mutual Authentication:** Both the server and the client authenticate each other using certificates.

**Application Examples:**

1. Establishing a secure connection using **SSL/TLS**.
2. Implementing a certificate-based two-way authentication scenario.

---

#### **8. PKI (Public Key Infrastructure)**

**Theoretical Explanation:** PKI encompasses the processes involved in the creation, distribution, management, and verification of digital certificates. PKI facilitates the management of key pairs and certificates necessary for secure communication.

- **Components:** CA (Certificate Authority), RA (Registration Authority), CRL (Certificate Revocation List), OCSP (Online Certificate Status Protocol).
- **Applications:** SSL/TLS, VPN, email security, code signing.

**Application Examples:**

1. Setting up a certificate management infrastructure using **PKI**.
2. Checking certificate revocations using **OCSP** and **CRL**.

---

#### **9. Whitebox Cryptography**

**Theoretical Explanation:** Whitebox cryptography ensures the secure implementation of encryption algorithms in an open system. With this technique, encryption processes protect sensitive information, such as keys, during operation.

- **Whitebox AES/DES:** Implementing AES and DES encryption algorithms in whitebox environments.
- **Applications:** Digital rights management (DRM), mobile application security.

**Application Examples:**

1. Encrypting a file using **Whitebox AES**.
2. Securing sensitive data using whitebox cryptography.

---

#### **10. Certificate and Key Management**

**Theoretical Explanation:** Proper management of certificates and cryptographic keys is essential for maintaining secure systems. Timely renewal, revocation, and storage of certificates are critical for a secure communication environment.

**Application Examples:**

1. Automatically renewing certificates and revoking old certificates (using CRL or OCSP).
2. Managing keys securely with **Key Management Systems**.

---

$$
End-Of-Week-9
$$

# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| main    | Yes       |

## Reporting a Vulnerability

Bu projede guvenlik acigi bulursaniz lutfen public issue acmayin.

1. GitHub uzerinden **Private vulnerability reporting** kullanin:
   - Repository → Security → Advisories → Report a vulnerability
2. Veya proje sahibine ozel mesaj gonderin.

### Beklenen bilgiler

- Acigin kisa aciklamasi
- Etkilenen endpoint / dosya
- Tekrar uretme adimlari
- Varsa PoC veya ekran goruntusu

### Yanit suresi

- Ilk yanit: 72 saat icinde
- Duzeltme plani: 7 gun icinde (onem derecesine gore)

## Guvenlik Kontrolleri

Bu repo asagidaki otomatik kontrolleri kullanir:

- CodeQL (SAST)
- Gitleaks (secret tarama)
- npm audit + Dependabot (SCA)
- Dependency Review (PR bagimlilik kontrolu)
- OWASP ZAP (DAST, canli URL ile)
- OpenSSF Scorecard (supply chain)

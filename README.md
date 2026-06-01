# FortiRule Builder

FortiRule Builder เป็นเว็บแอปภาษาไทยสำหรับสร้าง FortiGate CLI config แบบไม่ใช้ฐานข้อมูล รองรับการกำหนดค่า VLAN, DHCP, Firewall Policy และ NAT พร้อมคัดลอกผลลัพธ์หรือส่งออกเป็นไฟล์ `.txt`

## คุณสมบัติ

- VLAN Builder สำหรับสร้าง `config system interface`
- DHCP Builder สำหรับสร้าง DHCP scope บน VLAN
- Firewall Policy Builder สำหรับสร้าง policy พร้อม action, schedule, service, logging และ NAT
- NAT Builder รองรับ VIP / Port Forward และ Outbound NAT
- Generate FortiGate CLI config แบบ real-time
- ปุ่ม Copy CLI และ Export `.txt`

## การเริ่มต้นใช้งาน

```bash
npm install
npm run dev
```

เปิดเว็บที่ `http://localhost:3000`

## คำสั่งที่ใช้บ่อย

```bash
npm run lint
npm run build
```

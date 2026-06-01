"use client";

import { ChangeEvent, useMemo, useState } from "react";

type Vlan = {
  id: string;
  name: string;
  interface: string;
  ip: string;
  mask: string;
  allowAccess: string;
};

type Dhcp = {
  enabled: boolean;
  vlanId: string;
  gateway: string;
  startIp: string;
  endIp: string;
  netmask: string;
  dns1: string;
  dns2: string;
  leaseTime: string;
};

type FirewallPolicy = {
  name: string;
  srcintf: string;
  dstintf: string;
  srcaddr: string;
  dstaddr: string;
  schedule: string;
  service: string;
  action: "accept" | "deny";
  logtraffic: "all" | "utm" | "disable";
  nat: boolean;
};

type NatRule = {
  name: string;
  mode: "outbound" | "vip";
  extintf: string;
  mappedIp: string;
  extIp: string;
  extPort: string;
  mappedPort: string;
  protocol: "tcp" | "udp";
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20";
const labelClass = "mb-2 block text-sm font-medium text-slate-200";

const defaultVlan: Vlan = {
  id: "10",
  name: "VLAN10_USERS",
  interface: "port2",
  ip: "192.168.10.1",
  mask: "255.255.255.0",
  allowAccess: "ping https ssh",
};

const defaultDhcp: Dhcp = {
  enabled: true,
  vlanId: "10",
  gateway: "192.168.10.1",
  startIp: "192.168.10.100",
  endIp: "192.168.10.200",
  netmask: "255.255.255.0",
  dns1: "8.8.8.8",
  dns2: "1.1.1.1",
  leaseTime: "86400",
};

const defaultPolicy: FirewallPolicy = {
  name: "LAN_to_WAN",
  srcintf: "VLAN10_USERS",
  dstintf: "wan1",
  srcaddr: "all",
  dstaddr: "all",
  schedule: "always",
  service: "ALL",
  action: "accept",
  logtraffic: "all",
  nat: true,
};

const defaultNat: NatRule = {
  name: "WEB_Server_VIP",
  mode: "vip",
  extintf: "wan1",
  mappedIp: "192.168.10.10",
  extIp: "203.0.113.10",
  extPort: "443",
  mappedPort: "443",
  protocol: "tcp",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-slate-950/30 backdrop-blur">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-300">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function buildConfig(vlan: Vlan, dhcp: Dhcp, policy: FirewallPolicy, nat: NatRule) {
  const vlanName = vlan.name.trim() || `VLAN${vlan.id}`;
  const vlanId = vlan.id.trim() || "10";
  const configParts = [
    `# FortiRule Builder - Generated FortiGate CLI\n# ตรวจสอบค่า Interface, IP และ Policy ID ก่อนนำไปใช้งานจริง`,
    `config system interface\n    edit "${vlanName}"\n        set vdom "root"\n        set interface "${vlan.interface}"\n        set vlanid ${vlanId}\n        set ip ${vlan.ip} ${vlan.mask}\n        set allowaccess ${vlan.allowAccess}\n    next\nend`,
  ];

  if (dhcp.enabled) {
    configParts.push(
      `config system dhcp server\n    edit 0\n        set interface "${vlanName}"\n        set default-gateway ${dhcp.gateway}\n        set netmask ${dhcp.netmask}\n        set lease-time ${dhcp.leaseTime}\n        set dns-service specify\n        set dns-server1 ${dhcp.dns1}\n        set dns-server2 ${dhcp.dns2}\n        config ip-range\n            edit 1\n                set start-ip ${dhcp.startIp}\n                set end-ip ${dhcp.endIp}\n            next\n        end\n    next\nend`,
    );
  }

  if (nat.mode === "vip") {
    configParts.push(
      `config firewall vip\n    edit "${nat.name}"\n        set extintf "${nat.extintf}"\n        set extip ${nat.extIp}\n        set mappedip "${nat.mappedIp}"\n        set portforward enable\n        set protocol ${nat.protocol}\n        set extport ${nat.extPort}\n        set mappedport ${nat.mappedPort}\n    next\nend`,
    );
  }

  configParts.push(
    `config firewall policy\n    edit 0\n        set name "${policy.name}"\n        set srcintf "${policy.srcintf}"\n        set dstintf "${policy.dstintf}"\n        set srcaddr "${policy.srcaddr}"\n        set dstaddr "${nat.mode === "vip" ? nat.name : policy.dstaddr}"\n        set action ${policy.action}\n        set schedule "${policy.schedule}"\n        set service "${policy.service}"\n        set logtraffic ${policy.logtraffic}\n        set nat ${policy.nat || nat.mode === "outbound" ? "enable" : "disable"}\n    next\nend`,
  );

  if (nat.mode === "outbound") {
    configParts.push(
      `# Outbound NAT ใช้ค่า set nat enable ใน Firewall Policy ด้านบน\n# หากต้องการ Central SNAT ให้เปิดใช้งานและสร้าง rule เพิ่มเติมตาม topology ของคุณ`,
    );
  }

  return configParts.join("\n\n");
}

export default function Home() {
  const [vlan, setVlan] = useState(defaultVlan);
  const [dhcp, setDhcp] = useState(defaultDhcp);
  const [policy, setPolicy] = useState(defaultPolicy);
  const [nat, setNat] = useState(defaultNat);
  const [copyLabel, setCopyLabel] = useState("คัดลอก CLI");

  const generatedConfig = useMemo(() => buildConfig(vlan, dhcp, policy, nat), [vlan, dhcp, policy, nat]);

  const updateVlan = (key: keyof Vlan) => (event: ChangeEvent<HTMLInputElement>) =>
    setVlan((current) => ({ ...current, [key]: event.target.value }));

  const updateDhcp = (key: keyof Dhcp) => (event: ChangeEvent<HTMLInputElement>) =>
    setDhcp((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

  const updatePolicy = (key: keyof FirewallPolicy) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setPolicy((current) => ({
      ...current,
      [key]: event.target instanceof HTMLInputElement && event.target.type === "checkbox" ? event.target.checked : event.target.value,
    }));

  const updateNat = (key: keyof NatRule) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setNat((current) => ({ ...current, [key]: event.target.value }));

  const copyConfig = async () => {
    await navigator.clipboard.writeText(generatedConfig);
    setCopyLabel("คัดลอกแล้ว ✓");
    window.setTimeout(() => setCopyLabel("คัดลอก CLI"), 1800);
  };

  const exportConfig = () => {
    const blob = new Blob([generatedConfig], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fortirule-${vlan.id || "config"}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 overflow-hidden rounded-[2rem] border border-cyan-200/20 bg-slate-950/60 p-8 shadow-2xl shadow-cyan-950/40 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                FortiGate CLI Generator • ไม่มีฐานข้อมูล
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">FortiRule Builder</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
                เว็บแอปภาษาไทยสำหรับสร้างคอนฟิก VLAN, DHCP, Firewall Policy และ NAT พร้อมปุ่มคัดลอกและส่งออกไฟล์ .txt
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4 lg:min-w-[32rem]">
              {["VLAN", "DHCP", "Policy", "NAT"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="text-2xl font-black text-cyan-200">✓</div>
                  <div className="text-sm font-semibold text-slate-200">{item} Builder</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <Card title="VLAN Builder" description="กำหนด VLAN ID, Interface และ IP Gateway สำหรับ FortiGate">
              <Field label="ชื่อ VLAN Interface">
                <input className={inputClass} value={vlan.name} onChange={updateVlan("name")} />
              </Field>
              <Field label="VLAN ID">
                <input className={inputClass} value={vlan.id} onChange={updateVlan("id")} />
              </Field>
              <Field label="Parent Interface">
                <input className={inputClass} value={vlan.interface} onChange={updateVlan("interface")} />
              </Field>
              <Field label="IP Gateway">
                <input className={inputClass} value={vlan.ip} onChange={updateVlan("ip")} />
              </Field>
              <Field label="Subnet Mask">
                <input className={inputClass} value={vlan.mask} onChange={updateVlan("mask")} />
              </Field>
              <Field label="Allow Access">
                <input className={inputClass} value={vlan.allowAccess} onChange={updateVlan("allowAccess")} />
              </Field>
            </Card>

            <Card title="DHCP Builder" description="สร้าง DHCP scope สำหรับ VLAN ที่ต้องการแจก IP อัตโนมัติ">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 md:col-span-2">
                <input type="checkbox" checked={dhcp.enabled} onChange={updateDhcp("enabled")} className="h-5 w-5 accent-cyan-300" />
                <span className="font-medium text-slate-100">เปิดใช้งาน DHCP Server</span>
              </label>
              <Field label="Default Gateway">
                <input className={inputClass} value={dhcp.gateway} onChange={updateDhcp("gateway")} />
              </Field>
              <Field label="Netmask">
                <input className={inputClass} value={dhcp.netmask} onChange={updateDhcp("netmask")} />
              </Field>
              <Field label="Start IP">
                <input className={inputClass} value={dhcp.startIp} onChange={updateDhcp("startIp")} />
              </Field>
              <Field label="End IP">
                <input className={inputClass} value={dhcp.endIp} onChange={updateDhcp("endIp")} />
              </Field>
              <Field label="DNS 1">
                <input className={inputClass} value={dhcp.dns1} onChange={updateDhcp("dns1")} />
              </Field>
              <Field label="DNS 2">
                <input className={inputClass} value={dhcp.dns2} onChange={updateDhcp("dns2")} />
              </Field>
              <Field label="Lease Time (วินาที)">
                <input className={inputClass} value={dhcp.leaseTime} onChange={updateDhcp("leaseTime")} />
              </Field>
            </Card>

            <Card title="Firewall Policy Builder" description="กำหนดเส้นทาง Traffic, Service, Action และ Logging">
              <Field label="ชื่อ Policy">
                <input className={inputClass} value={policy.name} onChange={updatePolicy("name")} />
              </Field>
              <Field label="Source Interface">
                <input className={inputClass} value={policy.srcintf} onChange={updatePolicy("srcintf")} />
              </Field>
              <Field label="Destination Interface">
                <input className={inputClass} value={policy.dstintf} onChange={updatePolicy("dstintf")} />
              </Field>
              <Field label="Source Address">
                <input className={inputClass} value={policy.srcaddr} onChange={updatePolicy("srcaddr")} />
              </Field>
              <Field label="Destination Address">
                <input className={inputClass} value={policy.dstaddr} onChange={updatePolicy("dstaddr")} />
              </Field>
              <Field label="Service">
                <input className={inputClass} value={policy.service} onChange={updatePolicy("service")} />
              </Field>
              <Field label="Schedule">
                <input className={inputClass} value={policy.schedule} onChange={updatePolicy("schedule")} />
              </Field>
              <Field label="Action">
                <select className={inputClass} value={policy.action} onChange={updatePolicy("action")}>
                  <option value="accept">accept</option>
                  <option value="deny">deny</option>
                </select>
              </Field>
              <Field label="Log Traffic">
                <select className={inputClass} value={policy.logtraffic} onChange={updatePolicy("logtraffic")}>
                  <option value="all">all</option>
                  <option value="utm">utm</option>
                  <option value="disable">disable</option>
                </select>
              </Field>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                <input type="checkbox" checked={policy.nat} onChange={updatePolicy("nat")} className="h-5 w-5 accent-cyan-300" />
                <span className="font-medium text-slate-100">เปิด NAT ใน Policy</span>
              </label>
            </Card>

            <Card title="NAT Builder" description="เลือก Outbound NAT หรือ Virtual IP Port Forwarding">
              <Field label="ประเภท NAT">
                <select className={inputClass} value={nat.mode} onChange={updateNat("mode")}>
                  <option value="vip">VIP / Port Forward</option>
                  <option value="outbound">Outbound NAT</option>
                </select>
              </Field>
              <Field label="ชื่อ NAT / VIP">
                <input className={inputClass} value={nat.name} onChange={updateNat("name")} />
              </Field>
              <Field label="External Interface">
                <input className={inputClass} value={nat.extintf} onChange={updateNat("extintf")} />
              </Field>
              <Field label="External IP">
                <input className={inputClass} value={nat.extIp} onChange={updateNat("extIp")} />
              </Field>
              <Field label="Mapped Internal IP">
                <input className={inputClass} value={nat.mappedIp} onChange={updateNat("mappedIp")} />
              </Field>
              <Field label="Protocol">
                <select className={inputClass} value={nat.protocol} onChange={updateNat("protocol")}>
                  <option value="tcp">tcp</option>
                  <option value="udp">udp</option>
                </select>
              </Field>
              <Field label="External Port">
                <input className={inputClass} value={nat.extPort} onChange={updateNat("extPort")} />
              </Field>
              <Field label="Mapped Port">
                <input className={inputClass} value={nat.mappedPort} onChange={updateNat("mappedPort")} />
              </Field>
            </Card>
          </div>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-3xl border border-cyan-200/20 bg-slate-950/80 p-5 shadow-2xl shadow-slate-950/50 backdrop-blur">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">FortiGate CLI Config</h2>
                  <p className="text-sm text-slate-400">ผลลัพธ์จะอัปเดตทันทีเมื่อแก้ไขข้อมูล</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyConfig}
                    className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
                  >
                    {copyLabel}
                  </button>
                  <button
                    type="button"
                    onClick={exportConfig}
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    Export .txt
                  </button>
                </div>
              </div>
              <pre className="max-h-[75vh] overflow-auto rounded-2xl border border-white/10 bg-black/70 p-5 text-sm leading-6 text-cyan-50 shadow-inner">
                <code>{generatedConfig}</code>
              </pre>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

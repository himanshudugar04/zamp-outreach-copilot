"use client";
import { BUILTIN_PLAYBOOK_MD, ZAMP_COMPANY_MD, parseCompany, parsePlaybook, type CompanyProfile, type Playbook } from "./playbooks";

const K_COMPANY = "od.company.v1";
const K_PURPOSES = "od.purposes.v1";

export interface StoredPurpose {
  id: string;
  md: string;
  fileName?: string;
  addedAt: string;
}

function read<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

export function getCompanyFile(): { md: string; fileName?: string; custom: boolean } {
  const c = read<{ md: string; fileName?: string } | null>(K_COMPANY, null);
  return c ? { ...c, custom: true } : { md: ZAMP_COMPANY_MD, fileName: "zamp-company.md", custom: false };
}
export function setCompanyFile(md: string, fileName?: string) {
  write(K_COMPANY, { md, fileName });
}
export function resetCompanyFile() {
  try {
    localStorage.removeItem(K_COMPANY);
  } catch {}
}
export function getCompany(): CompanyProfile {
  return parseCompany(getCompanyFile().md).value;
}

export function listCustomPurposes(): StoredPurpose[] {
  return read<StoredPurpose[]>(K_PURPOSES, []);
}
export function saveCustomPurpose(md: string, fileName?: string): Playbook {
  const pb = parsePlaybook(md).value;
  const id = BUILTIN_PLAYBOOK_MD[pb.id] ? `${pb.id}_custom` : pb.id;
  const all = listCustomPurposes().filter((p) => p.id !== id);
  all.push({ id, md, fileName, addedAt: new Date().toISOString() });
  write(K_PURPOSES, all);
  return { ...pb, id };
}
export function deleteCustomPurpose(id: string) {
  write(K_PURPOSES, listCustomPurposes().filter((p) => p.id !== id));
}

export interface PurposeEntry {
  playbook: Playbook;
  md: string;
  custom: boolean;
  fileName?: string;
}

export function listPurposes(): PurposeEntry[] {
  const builtIns: PurposeEntry[] = Object.entries(BUILTIN_PLAYBOOK_MD).map(([id, md]) => ({
    playbook: { ...parsePlaybook(md, true).value, id },
    md,
    custom: false,
  }));
  const custom: PurposeEntry[] = listCustomPurposes().map((p) => ({
    playbook: { ...parsePlaybook(p.md).value, id: p.id },
    md: p.md,
    custom: true,
    fileName: p.fileName,
  }));
  return [...builtIns, ...custom];
}

/** What a run sends to the server: the files only when they differ from the built-ins. */
export function filesForRun(purposeId: string): { playbookMd?: string; companyMd?: string; purposeName: string } {
  const entry = listPurposes().find((p) => p.playbook.id === purposeId);
  const company = getCompanyFile();
  return {
    playbookMd: entry?.custom ? entry.md : undefined,
    companyMd: company.custom ? company.md : undefined,
    purposeName: entry?.playbook.name || purposeId,
  };
}

export function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

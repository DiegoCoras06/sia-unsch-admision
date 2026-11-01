import data from './ubigeo.json' with { type: 'json' };

type District = [string, string];
interface Province { id: string; name: string; districts: District[] }
interface Department { id: string; name: string; provinces: Province[] }

const departments = data as Department[];
const districtIndex = new Map<string, string>();
for (const d of departments) {
  for (const p of d.provinces) {
    for (const [id, name] of p.districts) districtIndex.set(id, `${name}, ${p.name}, ${d.name}`);
  }
}

/** Ubigeos INEI 2016 (shared/data/README.md). */
export const isValidDistrict = (code: string): boolean => districtIndex.has(code);
export const districtLabel = (code: string): string | null => districtIndex.get(code) ?? null;

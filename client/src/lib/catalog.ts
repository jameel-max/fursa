import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { CategoryNode, Governorate, Specialty, Unit } from '../types';

let cache: {
  categories?: CategoryNode[];
  units?: Unit[];
  specialties?: Specialty[];
  governorates?: Governorate[];
} = {};

export function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];
  const walk = (list: CategoryNode[]) => {
    for (const node of list) {
      result.push(node);
      walk(node.children);
    }
  };
  walk(nodes);
  return result;
}

export function useCatalog() {
  const [categories, setCategories] = useState<CategoryNode[]>(cache.categories ?? []);
  const [units, setUnits] = useState<Unit[]>(cache.units ?? []);
  const [specialties, setSpecialties] = useState<Specialty[]>(cache.specialties ?? []);
  const [governorates, setGovernorates] = useState<Governorate[]>(cache.governorates ?? []);
  const [loading, setLoading] = useState(!cache.categories);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesData, unitsData, specialtiesData, governoratesData] = await Promise.all([
        api<{ items: CategoryNode[] }>('/catalog/categories'),
        api<{ items: Unit[] }>('/catalog/units'),
        api<{ items: Specialty[] }>('/catalog/specialties'),
        api<{ items: Governorate[] }>('/catalog/governorates'),
      ]);
      cache = {
        categories: categoriesData.items,
        units: unitsData.items,
        specialties: specialtiesData.items,
        governorates: governoratesData.items,
      };
      setCategories(categoriesData.items);
      setUnits(unitsData.items);
      setSpecialties(specialtiesData.items);
      setGovernorates(governoratesData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تحميل البيانات الأساسية.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cache.categories) {
      void load();
    }
  }, [load]);

  const categoryMap = useMemo(() => {
    const map = new Map<number, CategoryNode>();
    for (const node of flattenCategories(categories)) map.set(node.id, node);
    return map;
  }, [categories]);

  const unitMap = useMemo(() => new Map(units.map((unit) => [unit.id, unit])), [units]);
  const governorateMap = useMemo(() => new Map(governorates.map((gov) => [gov.id, gov])), [governorates]);

  return {
    categories,
    units,
    specialties,
    governorates,
    categoryMap,
    unitMap,
    governorateMap,
    loading,
    error,
    reload: load,
  };
}

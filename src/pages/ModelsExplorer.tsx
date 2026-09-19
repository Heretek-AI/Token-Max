import { useState } from 'react';
import { useModels } from '../hooks/useModels';
import { ModelTable } from '../components/models/ModelTable';
import { SearchFilter } from '../components/shared/SearchFilter';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

export default function ModelsExplorer() {
  const { models, loading } = useModels();
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('all');

  if (loading) return <LoadingSpinner />;

  const providers = Array.from(new Set(models.map(m => m.provider))).sort();
  const categories = [
    { value: 'all', label: 'All Providers' },
    ...providers.map(p => ({ value: p, label: p }))
  ];

  const filteredModels = models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesProvider = provider === 'all' || m.provider === provider;
    return matchesSearch && matchesProvider;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Models Explorer</h1>
        <p className="text-text-muted">Compare pricing and context windows across {models.length} models.</p>
      </div>

      <SearchFilter 
        search={search}
        onSearchChange={setSearch}
        category={provider}
        onCategoryChange={setProvider}
        categories={categories}
        placeholder="Search models..."
      />

      <ModelTable models={filteredModels} />
    </div>
  );
}

import { Catalog, Product } from '../../components/Catalog';

const sampleProducts: Product[] = [];

export default function CatalogPage() {
  return <Catalog products={sampleProducts} />;
}

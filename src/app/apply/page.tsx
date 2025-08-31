import { ApplyPage, ApplicationInput } from '../../components/ApplyPage';

export default function Apply() {
  const handleSubmit = (a: ApplicationInput) => {
    console.log(a);
  };
  return <ApplyPage onSubmit={handleSubmit} />;
}

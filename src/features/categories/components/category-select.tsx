import { useQuery } from "@tanstack/react-query";
import { Select } from "@/components/ui/select";
import { categoryOptionsQuery } from "@/features/categories/queries";
import { m } from "@/paraglide/messages";

interface CategorySelectProps {
  value: number | null;
  onChange: (categoryId: number | null) => void;
  disabled?: boolean;   // ← 新增
}

export function CategorySelect({
  value,
  onChange,
  disabled,
}: CategorySelectProps) {
  const { data: categories = [], isLoading } = useQuery(categoryOptionsQuery);

  return (
    <Select
      value={value == null ? "" : String(value)}
      disabled={isLoading || disabled}   // ← 新增
      onChange={(next) => onChange(next === "" ? null : Number(next))}
      options={[
        { value: "", label: m.editor_meta_uncategorized() },
        ...categories.map((category) => ({
          value: String(category.id),
          label: category.name,
        })),
      ]}
    />
  );
}
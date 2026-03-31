"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileImport, faPenToSquare, faPlus } from "@fortawesome/free-solid-svg-icons";
import client from "@/app/api/client";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Badge } from "@/app/components/ui/badge";
import { ShadcnColumn, ShadcnDataTable } from "@/app/components/ShadcnDataTable";
import { CsvImportModal } from "@/app/components/CsvImportModal";
import { CsvRow, parseBooleanCell, splitMultiValueCell } from "@/app/lib/csv";

type VariantRow = {
  id: string;
  product_id: string;
  product_name: string;
  sku: string | null;
  price: number;
  quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ram: string;
  storage: string;
  group_key: string;
  colors: Array<{ id: string; label: string; hex: string | null }>;
  image_urls: string[];
};

type AttributeOption = {
  id: string;
  label: string;
  type_name: string;
  type_display_name: string;
  color_hex: string | null;
};

type ProductOption = {
  id: string;
  name: string;
};

type ProductVariantQueryRow = {
  id: string;
  product_id: string;
  sku: string | null;
  price: number;
  quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products: { name: string } | Array<{ name: string }> | null;
};

type VariantAttributeQueryRow = {
  product_variant_id: string;
  attribute_values:
    | {
        id: string;
        value: string;
        display_value: string | null;
        color_hex: string | null;
        attribute_types:
          | { name: string; display_name: string }
          | Array<{ name: string; display_name: string }>
          | null;
      }
    | Array<{
        id: string;
        value: string;
        display_value: string | null;
        color_hex: string | null;
        attribute_types:
          | { name: string; display_name: string }
          | Array<{ name: string; display_name: string }>
          | null;
      }>
    | null;
};

type ProductImageRow = {
  product_id: string;
  attribute_value_id: string | null;
  url: string;
  sort_order: number | null;
};

type VariantAttributeWithTypeRow = {
  id: string;
  attribute_value_id: string;
  attribute_values:
    | {
        attribute_types:
          | { name: string; display_name: string }
          | Array<{ name: string; display_name: string }>
          | null;
      }
    | Array<{
        attribute_types:
          | { name: string; display_name: string }
          | Array<{ name: string; display_name: string }>
          | null;
      }>
    | null;
};

const getFirstRelation = <T,>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
};

const normalizeType = (typeName: string, displayName: string) =>
  `${typeName} ${displayName}`.toLowerCase();

const getAttributeBucket = (typeName: string, displayName: string) => {
  const combined = normalizeType(typeName, displayName);
  if (combined.includes("color")) return "color";
  if (combined.includes("ram")) return "ram";
  if (combined.includes("storage") || combined.includes("rom")) return "storage";
  return "other";
};

const parseUrls = (value: string) =>
  value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);

const ColorBalls = ({
  colors,
}: {
  colors: Array<{ id: string; label: string; hex: string | null }>;
}) => {
  if (colors.length === 0) return <span className="text-xs text-gray-500">-</span>;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {colors.map((color) => (
        <div
          key={color.id}
          className="h-4 w-4 rounded-full border border-gray-300"
          style={{ backgroundColor: color.hex ?? "#9ca3af" }}
          title={color.label}
        />
      ))}
    </div>
  );
};

const Variants = () => {
  const [rows, setRows] = useState<VariantRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [attributes, setAttributes] = useState<AttributeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerUrls, setViewerUrls] = useState<string[]>([]);
  const [imageLookup, setImageLookup] = useState<Record<string, string[]>>({});

  const [productId, setProductId] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [ramId, setRamId] = useState("");
  const [storageId, setStorageId] = useState("");
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [colorImages, setColorImages] = useState<Record<string, string>>({});
  const isEditMode = editingVariantId !== null;
  const isVariantModalOpen = createOpen || isEditMode;

  const loadData = async () => {
    setLoading(true);
    setError("");

    const [variantResult, attrResult, imageResult, productResult, optionResult] =
      await Promise.all([
        client
          .from("product_variants")
          .select(
            "id, product_id, sku, price, quantity, is_active, created_at, updated_at, products(name)"
          )
          .order("created_at", { ascending: false }),
        client
          .from("variant_attributes")
          .select(
            "product_variant_id, attribute_values(id, value, display_value, color_hex, attribute_types(name, display_name))"
          ),
        client
          .from("product_images")
          .select("product_id, attribute_value_id, url, sort_order")
          .order("sort_order", { ascending: true }),
        client.from("products").select("id, name").order("name", { ascending: true }),
        client
          .from("attribute_values")
          .select(
            "id, value, display_value, color_hex, attribute_types(name, display_name)"
          ),
      ]);

    if (
      variantResult.error ||
      attrResult.error ||
      imageResult.error ||
      productResult.error ||
      optionResult.error
    ) {
      setError(
        variantResult.error?.message ??
          attrResult.error?.message ??
          imageResult.error?.message ??
          productResult.error?.message ??
          optionResult.error?.message ??
          "Failed to load variants data"
      );
      setLoading(false);
      return;
    }

    const attrMap = new Map<
      string,
      Array<{
        id: string;
        label: string;
        color_hex: string | null;
        type_name: string;
        type_display_name: string;
      }>
    >();

    ((attrResult.data as VariantAttributeQueryRow[]) ?? []).forEach((row) => {
      const attribute = getFirstRelation(row.attribute_values);
      const type = getFirstRelation(attribute?.attribute_types);
      if (!attribute || !type) return;

      const list = attrMap.get(row.product_variant_id) ?? [];
      list.push({
        id: attribute.id,
        label: attribute.display_value ?? attribute.value,
        color_hex: attribute.color_hex,
        type_name: type.name,
        type_display_name: type.display_name,
      });
      attrMap.set(row.product_variant_id, list);
    });

    const imagesByProductAndColor = new Map<string, string[]>();
    ((imageResult.data as ProductImageRow[]) ?? []).forEach((row) => {
      if (!row.attribute_value_id) return;
      const key = `${row.product_id}:${row.attribute_value_id}`;
      const current = imagesByProductAndColor.get(key) ?? [];
      current.push(row.url);
      imagesByProductAndColor.set(key, current);
    });
    setImageLookup(Object.fromEntries(imagesByProductAndColor.entries()));

    const normalizedRows: VariantRow[] = ((variantResult.data ??
      []) as ProductVariantQueryRow[]).map((variant) => {
      const product = getFirstRelation(variant.products);
      const attrs = attrMap.get(variant.id) ?? [];
      const ram =
        attrs.find(
          (attribute) =>
            getAttributeBucket(attribute.type_name, attribute.type_display_name) ===
            "ram"
        )?.label ?? "-";
      const storage =
        attrs.find(
          (attribute) =>
            getAttributeBucket(attribute.type_name, attribute.type_display_name) ===
            "storage"
        )?.label ?? "-";

      const colors = attrs
        .filter(
          (attribute) =>
            getAttributeBucket(attribute.type_name, attribute.type_display_name) ===
            "color"
        )
        .map((attribute) => ({
          id: attribute.id,
          label: attribute.label,
          hex: attribute.color_hex,
        }));

      const imageUrls = Array.from(
        new Set(
          colors.flatMap(
            (color) =>
              imagesByProductAndColor.get(`${variant.product_id}:${color.id}`) ?? []
          )
        )
      );

      return {
        id: variant.id,
        product_id: variant.product_id,
        product_name: product?.name ?? "Unknown Product",
        sku: variant.sku,
        price: variant.price,
        quantity: variant.quantity,
        is_active: variant.is_active,
        created_at: variant.created_at,
        updated_at: variant.updated_at,
        ram,
        storage,
        group_key: `${ram} + ${storage}`,
        colors,
        image_urls: imageUrls,
      };
    });

    const normalizedProducts = ((productResult.data as ProductOption[]) ?? []).map(
      (product) => ({ id: product.id, name: product.name })
    );

    const normalizedOptions: AttributeOption[] = ((optionResult.data ?? []) as Array<{
      id: string;
      value: string;
      display_value: string | null;
      color_hex: string | null;
      attribute_types:
        | { name: string; display_name: string }
        | Array<{ name: string; display_name: string }>
        | null;
    }>)
      .map((option) => {
        const type = getFirstRelation(option.attribute_types);
        if (!type) return null;
        return {
          id: option.id,
          label: option.display_value ?? option.value,
          type_name: type.name,
          type_display_name: type.display_name,
          color_hex: option.color_hex,
        };
      })
      .filter((value): value is AttributeOption => value !== null);

    setRows(normalizedRows);
    setProducts(normalizedProducts);
    setAttributes(normalizedOptions);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const colorOptions = useMemo(
    () =>
      attributes.filter(
        (attribute) =>
          getAttributeBucket(attribute.type_name, attribute.type_display_name) ===
          "color"
      ),
    [attributes]
  );

  const ramOptions = useMemo(
    () =>
      attributes.filter(
        (attribute) =>
          getAttributeBucket(attribute.type_name, attribute.type_display_name) === "ram"
      ),
    [attributes]
  );

  const storageOptions = useMemo(
    () =>
      attributes.filter(
        (attribute) =>
          getAttributeBucket(attribute.type_name, attribute.type_display_name) ===
          "storage"
      ),
    [attributes]
  );

  const groupColorMap = useMemo(() => {
    const map = new Map<string, Array<{ id: string; label: string; hex: string | null }>>();
    rows.forEach((row) => {
      const current = map.get(row.group_key) ?? [];
      const dedupe = new Map(current.map((color) => [color.id, color]));
      row.colors.forEach((color) => dedupe.set(color.id, color));
      map.set(row.group_key, Array.from(dedupe.values()));
    });
    return map;
  }, [rows]);

  const columns: ShadcnColumn<VariantRow>[] = [
    {
      key: "id",
      header: "ID",
      cell: (row) => <span className="font-mono text-xs">{row.id}</span>,
    },
    {
      key: "product_name",
      header: "Product Name",
      cell: (row) => row.product_name,
    },
    {
      key: "sku",
      header: "SKU",
      cell: (row) => row.sku ?? "-",
    },
    {
      key: "price",
      header: "Price",
      cell: (row) => `MMK ${row.price.toLocaleString()}`,
    },
    {
      key: "quantity",
      header: "Quantity",
      cell: (row) => row.quantity,
    },
    {
      key: "is_active",
      header: "Active",
      cell: (row) => (
        <Badge variant={row.is_active ? "success" : "danger"}>
          {row.is_active ? "active" : "inactive"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      cell: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: "updated_at",
      header: "Updated",
      cell: (row) => new Date(row.updated_at).toLocaleDateString(),
    },
    {
      key: "group",
      header: "RAM + ROM",
      cell: (row) => row.group_key,
    },
    {
      key: "colors",
      header: "Available Colors",
      cell: (row) => <ColorBalls colors={groupColorMap.get(row.group_key) ?? []} />,
    },
    {
      key: "images",
      header: "Images",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setViewerUrls(row.image_urls);
            setImageViewerOpen(true);
          }}
        >
          View ({row.image_urls.length})
        </Button>
      ),
    },
  ];

  const handleDeleteRows = async (ids: string[]) => {
    setDeleting(true);
    setError("");
    try {
      const { error: attrError } = await client
        .from("variant_attributes")
        .delete()
        .in("product_variant_id", ids);
      if (attrError) throw new Error(attrError.message);

      const { error: variantError } = await client
        .from("product_variants")
        .delete()
        .in("id", ids);
      if (variantError) throw new Error(variantError.message);

      setRows((prev) => prev.filter((row) => !ids.includes(row.id)));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const resetCreateState = () => {
    setProductId("");
    setSku("");
    setPrice("");
    setQuantity("0");
    setIsActive(true);
    setRamId("");
    setStorageId("");
    setSelectedColorIds([]);
    setColorImages({});
    setEditingVariantId(null);
    setCreateOpen(false);
  };

  const openCreateModal = () => {
    resetCreateState();
    setCreateOpen(true);
  };

  const openEditModal = (row: VariantRow) => {
    setEditingVariantId(row.id);
    setCreateOpen(false);
    setProductId(row.product_id);
    setSku(row.sku ?? "");
    setPrice(String(row.price));
    setQuantity(String(row.quantity));
    setIsActive(row.is_active);
    setSelectedColorIds(row.colors.map((color) => color.id));
    setColorImages(
      Object.fromEntries(
        row.colors.map((color) => [
          color.id,
          (imageLookup[`${row.product_id}:${color.id}`] ?? []).join("\n"),
        ])
      )
    );
  };

  const handleCreateVariant = async () => {
    if (!productId || !price) {
      setError("Product and price are required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const { data: createdVariant, error: variantError } = await client
        .from("product_variants")
        .insert({
          product_id: productId,
          sku: sku.trim() || null,
          price: Number(price),
          quantity: Number(quantity || 0),
          is_active: isActive,
        })
        .select("id, product_id")
        .single<{ id: string; product_id: string }>();

      if (variantError || !createdVariant) {
        throw new Error(variantError?.message ?? "Failed to create variant");
      }

      const attributeIds = Array.from(
        new Set([ramId, storageId, ...selectedColorIds].filter(Boolean))
      );

      if (attributeIds.length > 0) {
        const { error: variantAttributesError } = await client
          .from("variant_attributes")
          .insert(
            attributeIds.map((attributeId) => ({
              product_variant_id: createdVariant.id,
              attribute_value_id: attributeId,
            }))
          );

        if (variantAttributesError) {
          throw new Error(variantAttributesError.message);
        }
      }

      const imageRows = selectedColorIds.flatMap((colorId) => {
        const urls = parseUrls(colorImages[colorId] ?? "");
        return urls.map((url, index) => ({
          product_id: createdVariant.product_id,
          attribute_value_id: colorId,
          url,
          sort_order: index,
        }));
      });

      if (imageRows.length > 0) {
        const { error: imageError } = await client
          .from("product_images")
          .insert(imageRows);
        if (imageError) {
          throw new Error(imageError.message);
        }
      }

      setCreateOpen(false);
      resetCreateState();
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVariant = async () => {
    if (!editingVariantId || !productId || !price) {
      setError("Product and price are required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const { error: updateError } = await client
        .from("product_variants")
        .update({
          product_id: productId,
          sku: sku.trim() || null,
          price: Number(price),
          quantity: Number(quantity || 0),
          is_active: isActive,
        })
        .eq("id", editingVariantId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      const { data: existingAttrs, error: existingAttrError } = await client
        .from("variant_attributes")
        .select("id, attribute_value_id, attribute_values(attribute_types(name, display_name))")
        .eq("product_variant_id", editingVariantId);

      if (existingAttrError) {
        throw new Error(existingAttrError.message);
      }

      const colorAttributeRowIds = ((existingAttrs as VariantAttributeWithTypeRow[]) ?? [])
        .filter((row) => {
          const attrValue = getFirstRelation(row.attribute_values);
          const type = getFirstRelation(attrValue?.attribute_types);
          if (!type) return false;
          return getAttributeBucket(type.name, type.display_name) === "color";
        })
        .map((row) => row.id);

      if (colorAttributeRowIds.length > 0) {
        const { error: deleteColorAttrsError } = await client
          .from("variant_attributes")
          .delete()
          .in("id", colorAttributeRowIds);
        if (deleteColorAttrsError) {
          throw new Error(deleteColorAttrsError.message);
        }
      }

      if (selectedColorIds.length > 0) {
        const { error: insertColorsError } = await client
          .from("variant_attributes")
          .insert(
            selectedColorIds.map((attributeId) => ({
              product_variant_id: editingVariantId,
              attribute_value_id: attributeId,
            }))
          );
        if (insertColorsError) {
          throw new Error(insertColorsError.message);
        }
      }

      await Promise.all(
        selectedColorIds.map(async (colorId) => {
          const { error: deleteImagesError } = await client
            .from("product_images")
            .delete()
            .eq("product_id", productId)
            .eq("attribute_value_id", colorId);
          if (deleteImagesError) {
            throw new Error(deleteImagesError.message);
          }

          const urls = parseUrls(colorImages[colorId] ?? "");
          if (urls.length === 0) return;

          const { error: insertImagesError } = await client
            .from("product_images")
            .insert(
              urls.map((url, index) => ({
                product_id: productId,
                attribute_value_id: colorId,
                url,
                sort_order: index,
              }))
            );
          if (insertImagesError) {
            throw new Error(insertImagesError.message);
          }
        })
      );

      resetCreateState();
      await loadData();
    } catch (updateVariantError) {
      setError(updateVariantError instanceof Error ? updateVariantError.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const getColorAttributeRows = async (variantId: string) => {
    const { data, error: queryError } = await client
      .from("variant_attributes")
      .select("id, attribute_value_id, attribute_values(attribute_types(name, display_name))")
      .eq("product_variant_id", variantId);
    if (queryError) throw new Error(queryError.message);

    return ((data as VariantAttributeWithTypeRow[]) ?? []).filter((row) => {
      const attrValue = getFirstRelation(row.attribute_values);
      const type = getFirstRelation(attrValue?.attribute_types);
      if (!type) return false;
      return getAttributeBucket(type.name, type.display_name) === "color";
    });
  };

  const upsertColorImages = async (
    productId: string,
    oldColorIds: string[],
    newColorIds: string[],
    imageUrls: string[]
  ) => {
    if (oldColorIds.length > 0) {
      const { error: deleteOldImagesError } = await client
        .from("product_images")
        .delete()
        .eq("product_id", productId)
        .in("attribute_value_id", oldColorIds);
      if (deleteOldImagesError) throw new Error(deleteOldImagesError.message);
    }

    if (newColorIds.length === 0 || imageUrls.length === 0) return;

    const rows = newColorIds.flatMap((colorId) =>
      imageUrls.map((url, index) => ({
        product_id: productId,
        attribute_value_id: colorId,
        url,
        sort_order: index,
        is_primary: index === 0,
      }))
    );

    const { error: insertImageError } = await client.from("product_images").insert(rows);
    if (insertImageError) throw new Error(insertImageError.message);
  };

  const handleImportVariants = async (rowsToImport: CsvRow[]) => {
    setImporting(true);
    setError("");

    try {
      const productMap = new Map(products.map((product) => [product.name.toLowerCase(), product]));
      const existingBySku = new Map(
        rows
          .filter((row) => row.sku)
          .map((row) => [String(row.sku).toLowerCase(), row])
      );

      const attributeMap = new Map(
        attributes.map((attribute) => [attribute.label.toLowerCase(), attribute])
      );

      for (const csvRow of rowsToImport) {
        const productName = csvRow.product?.trim();
        const skuValue = csvRow.sku?.trim();
        const priceValue = csvRow.price?.trim();
        const quantityValue = csvRow.quantity?.trim();

        if (!productName || !skuValue || !priceValue || !quantityValue) {
          throw new Error("Each variant CSV row must include product, sku, price, quantity.");
        }

        const product = productMap.get(productName.toLowerCase());
        if (!product) throw new Error(`Unknown product name: ${productName}`);

        const isActiveValue = parseBooleanCell(csvRow.is_active ?? "", true);
        const ramLabel = csvRow.ram?.trim();
        const romLabel = csvRow.rom?.trim();
        const colorLabels = splitMultiValueCell(csvRow.colors ?? "");
        const imageUrls = splitMultiValueCell(csvRow.image_urls ?? "");

        const resolvedRam =
          ramLabel.length > 0 ? attributeMap.get(ramLabel.toLowerCase()) : undefined;
        const resolvedRom =
          romLabel.length > 0 ? attributeMap.get(romLabel.toLowerCase()) : undefined;

        if (
          resolvedRam &&
          getAttributeBucket(resolvedRam.type_name, resolvedRam.type_display_name) !== "ram"
        ) {
          throw new Error(`Attribute "${ramLabel}" is not a RAM value.`);
        }
        if (
          resolvedRom &&
          getAttributeBucket(resolvedRom.type_name, resolvedRom.type_display_name) !== "storage"
        ) {
          throw new Error(`Attribute "${romLabel}" is not a ROM/Storage value.`);
        }

        const resolvedColors = colorLabels.map((label) => {
          const attr = attributeMap.get(label.toLowerCase());
          if (!attr) throw new Error(`Unknown color value: ${label}`);
          if (getAttributeBucket(attr.type_name, attr.type_display_name) !== "color") {
            throw new Error(`Attribute "${label}" is not a color value.`);
          }
          return attr;
        });
        const colorIds = resolvedColors.map((color) => color.id);

        const existingVariant = existingBySku.get(skuValue.toLowerCase());
        if (existingVariant) {
          const { error: updateError } = await client
            .from("product_variants")
            .update({
              product_id: product.id,
              sku: skuValue,
              price: Number(priceValue),
              quantity: Number(quantityValue),
              is_active: isActiveValue,
            })
            .eq("id", existingVariant.id);
          if (updateError) throw new Error(updateError.message);

          if (colorIds.length > 0) {
            const colorRows = await getColorAttributeRows(existingVariant.id);
            const oldColorIds = colorRows.map((row) => row.attribute_value_id);

            if (colorRows.length > 0) {
              const { error: deleteColorAttrsError } = await client
                .from("variant_attributes")
                .delete()
                .in(
                  "id",
                  colorRows.map((row) => row.id)
                );
              if (deleteColorAttrsError) throw new Error(deleteColorAttrsError.message);
            }

            const { error: insertColorAttrsError } = await client
              .from("variant_attributes")
              .insert(
                colorIds.map((colorId) => ({
                  product_variant_id: existingVariant.id,
                  attribute_value_id: colorId,
                }))
              );
            if (insertColorAttrsError) throw new Error(insertColorAttrsError.message);

            await upsertColorImages(product.id, oldColorIds, colorIds, imageUrls);
          }
        } else {
          const { data: insertedVariant, error: insertVariantError } = await client
            .from("product_variants")
            .insert({
              product_id: product.id,
              sku: skuValue,
              price: Number(priceValue),
              quantity: Number(quantityValue),
              is_active: isActiveValue,
            })
            .select("id")
            .single<{ id: string }>();
          if (insertVariantError || !insertedVariant) {
            throw new Error(insertVariantError?.message ?? "Failed to create variant");
          }

          const attributeIds = [
            resolvedRam?.id,
            resolvedRom?.id,
            ...colorIds,
          ].filter((value): value is string => Boolean(value));

          if (attributeIds.length > 0) {
            const { error: insertAttrsError } = await client
              .from("variant_attributes")
              .insert(
                attributeIds.map((attributeId) => ({
                  product_variant_id: insertedVariant.id,
                  attribute_value_id: attributeId,
                }))
              );
            if (insertAttrsError) throw new Error(insertAttrsError.message);
          }

          await upsertColorImages(product.id, [], colorIds, imageUrls);
        }
      }

      await loadData();
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <div className="p-6">Loading variants...</div>;

  return (
    <div className="min-h-screen space-y-4 p-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ShadcnDataTable
        title="Product Variants"
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        getRowName={(row) => row.sku ?? row.product_name}
        getRowCreatedAt={(row) => row.created_at}
        getRowCategory={(row) => row.group_key}
        onDeleteRows={handleDeleteRows}
        deleting={deleting}
        emptyText="No product variants found."
        categoryLabel="RAM + ROM"
        itemsPerPage={8}
        exportFileName="product-variants"
        getExportRow={(row) => ({
          id: row.id,
          product_name: row.product_name,
          sku: row.sku ?? "",
          price: row.price,
          quantity: row.quantity,
          is_active: row.is_active,
          ram: row.ram,
          rom: row.storage,
          colors: row.colors.map((color) => color.label).join("|"),
          image_urls: row.image_urls.join("|"),
          created_at: row.created_at,
          updated_at: row.updated_at,
        })}
        toolbarActions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setImportOpen(true)}>
              <FontAwesomeIcon icon={faFileImport} />
              Import CSV
            </Button>
            <Button
              className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={openCreateModal}
            >
              <FontAwesomeIcon icon={faPlus} />
              Create New
            </Button>
          </div>
        }
        rowActions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-blue-600 hover:text-blue-700"
            onClick={() => openEditModal(row)}
          >
            <FontAwesomeIcon icon={faPenToSquare} />
          </Button>
        )}
      />

      {isVariantModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={resetCreateState}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-gray-200 bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">
              {isEditMode ? "Edit Product Variant" : "Create Product Variant"}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {isEditMode
                ? "Update variant core fields and color/image mappings. RAM/ROM stay fixed."
                : "One submit will create variant, variant attributes, and color images."}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span>Product</span>
                <select
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span>SKU</span>
                <input
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Price (MMK)</span>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Quantity</span>
                <input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                />
              </label>
              {!isEditMode && (
                <>
                  <label className="space-y-1 text-sm">
                    <span>RAM (Optional)</span>
                    <select
                      value={ramId}
                      onChange={(event) => setRamId(event.target.value)}
                      className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                    >
                      <option value="">Select RAM</option>
                      {ramOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm">
                    <span>ROM / Storage (Optional)</span>
                    <select
                      value={storageId}
                      onChange={(event) => setStorageId(event.target.value)}
                      className="h-10 w-full rounded-md border border-gray-300 bg-background px-3"
                    >
                      <option value="">Select ROM / Storage</option>
                      {storageOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>

            <label className="mt-3 inline-flex items-center gap-2 text-sm">
              <Checkbox checked={isActive} onChange={() => setIsActive((value) => !value)} />
              Active variant
            </label>

            <div className="mt-5 space-y-3">
              <h4 className="text-sm font-semibold">Colors + Images</h4>
              {colorOptions.map((option) => {
                const checked = selectedColorIds.includes(option.id);
                return (
                  <div key={option.id} className="rounded-md border border-gray-200 p-3">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onChange={() => {
                          setSelectedColorIds((prev) =>
                            checked
                              ? prev.filter((id) => id !== option.id)
                              : [...prev, option.id]
                          );
                        }}
                      />
                      <span
                        className="inline-block h-4 w-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: option.color_hex ?? "#9ca3af" }}
                      />
                      {option.label}
                    </label>
                    {checked && (
                      <textarea
                        rows={3}
                        placeholder="Paste image URLs (comma or new line separated)"
                        value={colorImages[option.id] ?? ""}
                        onChange={(event) =>
                          setColorImages((prev) => ({
                            ...prev,
                            [option.id]: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-md border border-gray-300 bg-background p-2 text-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={resetCreateState}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-700 text-white hover:bg-emerald-800"
                onClick={isEditMode ? handleUpdateVariant : handleCreateVariant}
                disabled={saving}
              >
                {saving
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Variant"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {imageViewerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setImageViewerOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-gray-200 bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Variant Images</h3>
            <div className="mt-3 max-h-[60vh] overflow-y-auto">
              {viewerUrls.length === 0 ? (
                <p className="text-sm text-gray-500">No images found for this variant color set.</p>
              ) : (
                <div className="space-y-2">
                  {viewerUrls.map((url, index) => (
                    <a
                      key={`${url}-${index}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate rounded-md border border-gray-200 p-2 text-sm text-blue-600 hover:bg-gray-50"
                    >
                      {url}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setImageViewerOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <CsvImportModal
        open={importOpen}
        title="Import Product Variants CSV"
        requiredHeaders={["product", "sku", "price", "quantity", "is_active"]}
        optionalHeaders={["ram", "rom", "colors", "image_urls"]}
        importing={importing}
        onClose={() => setImportOpen(false)}
        onImport={handleImportVariants}
      />
    </div>
  );
};

export default Variants;

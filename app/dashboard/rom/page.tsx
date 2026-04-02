"use client";

import AttributeValuesPage from "@/app/components/AttributeValuesPage";

const RomPage = () => (
  <AttributeValuesPage
    title="ROM"
    typeMatchers={["rom", "storage"]}
    emptyText="No ROM values found."
    categoryLabel="Type"
  />
);

export default RomPage;

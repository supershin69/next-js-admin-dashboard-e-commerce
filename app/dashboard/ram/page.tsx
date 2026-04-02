"use client";

import AttributeValuesPage from "@/app/components/AttributeValuesPage";

const RamPage = () => (
  <AttributeValuesPage
    title="RAM"
    typeMatchers={["ram"]}
    emptyText="No RAM values found."
    categoryLabel="Type"
  />
);

export default RamPage;

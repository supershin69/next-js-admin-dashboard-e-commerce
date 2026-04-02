"use client";

import AttributeValuesPage from "@/app/components/AttributeValuesPage";

const ColorsPage = () => (
  <AttributeValuesPage
    title="Colors"
    typeMatchers={["color"]}
    emptyText="No colors found."
    colorEnabled
    categoryLabel="Type"
  />
);

export default ColorsPage;

export function toCategorySlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function fromCategorySlug(slug, categoryNames) {
  return categoryNames.find(n => toCategorySlug(n) === slug) || null
}

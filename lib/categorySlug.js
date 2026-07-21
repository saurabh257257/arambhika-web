function toCategorySlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function fromCategorySlug(slug, categoryNames) {
  return categoryNames.find(n => toCategorySlug(n) === slug) || null
}

module.exports = { toCategorySlug, fromCategorySlug }

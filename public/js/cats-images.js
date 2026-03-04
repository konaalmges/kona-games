// ═══════════════════════════════════════
// KONA GAMES – Category Images v2
// صور Unsplash عالية الجودة لكل فئة
// ═══════════════════════════════════════
const CAT_IMAGES = {
  geography: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=900&q=90',
  sports:    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&q=90',
  culture:   'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=90',
  history:   'https://images.unsplash.com/photo-1599619585752-c3edb42a414c?w=900&q=90',
  movies:    'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=900&q=90',
  science:   'https://images.unsplash.com/photo-1532094349884-543559059b63?w=900&q=90',
  religion:  'https://images.unsplash.com/photo-1584286595398-a59511e8649f?w=900&q=90',
  food:      'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?w=900&q=90',
  music:     'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&q=90',
  gaming:    'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=900&q=90',
  art:       'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=900&q=90',
  nature:    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=90',
};

function getCatImage(id) {
  return CAT_IMAGES[id] || 'https://images.unsplash.com/photo-1516397281156-ca07cf9746fc?w=900&q=90';
}

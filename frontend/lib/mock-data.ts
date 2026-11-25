import type { Message, Property, Request, TenantProfile, WalletBalance } from '@rentr/types';

export const mockProperties: readonly Property[] = [
  {
    id: 'sunlit-maadi-apartment',
    title: 'Sunlit two-bedroom apartment',
    type: 'apartment',
    community: 'Maadi',
    bedrooms: 2,
    bathrooms: 2,
    area: 128,
    areaUnit: 'm²',
    furnishing: 'furnished',
    rent: 28000,
    currency: 'EGP',
    rentPeriod: 'month',
    availabilityDate: '2026-11-01',
    description:
      'A bright, comfortable apartment with an open living and dining area, generous natural light, and a quiet residential feel.',
    images: [
      {
        url: '/property-images/furnished-apartment.jpeg',
        alt: 'Bright furnished apartment with a dining and living area',
      },
    ],
    approximateLocation: 'Maadi, Cairo',
    address: 'Example Street 12, Maadi, Cairo',
    mapPin: { latitude: 29.9602, longitude: 31.2569 },
    additionalInfo: 'Air conditioning, in-unit laundry, and a secure building entrance.',
    updatedAt: '2026-10-02T12:45:00.000Z',
  },
  {
    id: 'garden-view-studio',
    title: 'Quiet garden-view studio',
    type: 'studio',
    community: 'Zamalek',
    bedrooms: 1,
    bathrooms: 1,
    area: 74,
    areaUnit: 'm²',
    furnishing: 'partially-furnished',
    rent: 22000,
    currency: 'EGP',
    rentPeriod: 'month',
    availabilityDate: '2026-10-20',
    description:
      'A calm, light-filled studio with flexible living space and a leafy outlook in a walkable neighborhood.',
    images: [
      {
        url: '/property-images/apartment-living-room.jpg',
        alt: 'Soft neutral living room in a modern apartment',
      },
    ],
    approximateLocation: 'Zamalek, Cairo',
    address: 'Example Avenue 8, Zamalek, Cairo',
    mapPin: { latitude: 30.0618, longitude: 31.2197 },
    additionalInfo: 'Elevator access and a shared rooftop terrace.',
    updatedAt: '2026-10-02T10:05:00.000Z',
  },
  {
    id: 'river-view-two-bedroom',
    title: 'Open-plan two-bedroom home',
    type: 'apartment',
    community: 'Sheikh Zayed',
    bedrooms: 2,
    bathrooms: 2,
    area: 142,
    areaUnit: 'm²',
    furnishing: 'furnished',
    rent: 34500,
    currency: 'EGP',
    rentPeriod: 'month',
    availabilityDate: '2026-11-15',
    description:
      'An airy open-plan home with generous shared space, simple finishes, and room to settle in.',
    images: [
      {
        url: '/property-images/bright-apartment-living-room.jpg',
        alt: 'Sunlit, neutral living room in a furnished apartment',
      },
    ],
    approximateLocation: 'Sheikh Zayed, Giza',
    address: 'Example Road 21, Sheikh Zayed, Giza',
    mapPin: { latitude: 30.0131, longitude: 30.9764 },
    additionalInfo: 'Building parking and a small shared outdoor area.',
    updatedAt: '2026-10-01T16:20:00.000Z',
  },
];

export const mockTenantProfile: TenantProfile = {
  id: 'tenant-maya',
  name: 'Maya Chen',
  occupation: 'Product designer',
  isStudent: false,
  livingArrangement: 'couple',
  familySize: 2,
  moveInDate: '2026-11-01',
  introduction:
    'My partner and I are looking for a bright, well-kept home close to local cafés and transit.',
};

export function getMockRequests(): readonly Request[] {
  const now = Date.now();

  return [
    {
      id: 'request-001',
      propertyId: 'sunlit-maadi-apartment',
      tenantProfileId: mockTenantProfile.id,
      status: 'pending',
      message:
        'The apartment looks like a good fit for us. Would a move-in during the first week of November work?',
      createdAt: new Date(now - 18 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(now + 5.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'request-002',
      propertyId: 'garden-view-studio',
      tenantProfileId: mockTenantProfile.id,
      status: 'pending',
      message: 'I would be glad to learn more about the neighborhood and viewing times.',
      createdAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(now + 19 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export const mockMessages: readonly Message[] = [
  {
    id: 'message-001',
    requestId: 'request-001',
    senderId: mockTenantProfile.id,
    senderName: mockTenantProfile.name,
    sentAt: 'Oct 2, 10:14 AM',
    content: {
      kind: 'text',
      text: 'Hello, I am interested in the apartment. Is the November availability still current?',
    },
  },
  {
    id: 'message-002',
    requestId: 'request-001',
    senderId: 'owner-demo',
    senderName: 'Jordan Lee',
    sentAt: 'Oct 2, 10:26 AM',
    content: {
      kind: 'text',
      text: 'Yes, that timing should work. The public listing shows only the approximate neighborhood.',
    },
  },
  {
    id: 'message-003',
    requestId: 'request-001',
    senderId: mockTenantProfile.id,
    senderName: mockTenantProfile.name,
    sentAt: 'Oct 2, 10:31 AM',
    content: {
      kind: 'location',
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Maadi%2C+Cairo',
      label: 'Approximate neighborhood: Maadi',
    },
  },
];

export const mockWalletBalance: WalletBalance = {
  available: 8,
  reserved: 2,
};

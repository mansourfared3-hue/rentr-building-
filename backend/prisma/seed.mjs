import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const seedPrefix = 'rentr-demo-v1';
const now = new Date();
const day = 24 * 60 * 60 * 1000;

const communities = [
  { name: 'التجمع الخامس', city: 'القاهرة الجديدة', lat: 30.0174, lng: 31.4913, baseRent: 24500 },
  { name: 'الرحاب', city: 'القاهرة الجديدة', lat: 30.0612, lng: 31.4957, baseRent: 22000 },
  { name: 'مدينتي', city: 'القاهرة الجديدة', lat: 30.0831, lng: 31.6424, baseRent: 19500 },
  { name: 'المعادي', city: 'القاهرة', lat: 29.9602, lng: 31.2569, baseRent: 20500 },
  { name: 'الزمالك', city: 'القاهرة', lat: 30.0618, lng: 31.2197, baseRent: 26000 },
  { name: 'مدينة نصر', city: 'القاهرة', lat: 30.0511, lng: 31.3656, baseRent: 14500 },
  { name: 'مصر الجديدة', city: 'القاهرة', lat: 30.0876, lng: 31.3223, baseRent: 17500 },
  { name: 'الشيخ زايد', city: 'الجيزة', lat: 30.0131, lng: 30.9764, baseRent: 23500 },
  { name: 'السادس من أكتوبر', city: 'الجيزة', lat: 29.9668, lng: 30.9232, baseRent: 16000 },
  { name: 'الدقي', city: 'الجيزة', lat: 30.0384, lng: 31.2122, baseRent: 18000 },
  { name: 'المهندسين', city: 'الجيزة', lat: 30.0566, lng: 31.2012, baseRent: 19500 },
  { name: 'سموحة', city: 'الإسكندرية', lat: 31.2156, lng: 29.9553, baseRent: 15000 },
  { name: 'سيدي جابر', city: 'الإسكندرية', lat: 31.2207, lng: 29.9428, baseRent: 14500 },
  { name: 'العجمي', city: 'الإسكندرية', lat: 31.0959, lng: 29.7672, baseRent: 9500 },
  { name: 'المنصورة الجديدة', city: 'الدقهلية', lat: 31.4372, lng: 31.6921, baseRent: 11500 },
];

const propertyKinds = [
  { type: 'APARTMENT', label: 'شقة', rooms: 2, area: 115, factor: 1 },
  { type: 'APARTMENT', label: 'شقة عائلية', rooms: 3, area: 155, factor: 1.32 },
  { type: 'STUDIO', label: 'استوديو', rooms: 1, area: 62, factor: 0.72 },
  { type: 'HOUSE', label: 'منزل مستقل', rooms: 4, area: 220, factor: 1.8 },
  { type: 'ROOM', label: 'غرفة مفروشة', rooms: 1, area: 34, factor: 0.38 },
  { type: 'APARTMENT', label: 'شقة حديثة', rooms: 2, area: 130, factor: 1.12 },
];

const furnishings = ['FURNISHED', 'PARTIALLY_FURNISHED', 'UNFURNISHED', 'UNKNOWN'];
const firstNames = [
  'محمد',
  'مريم',
  'أحمد',
  'نور',
  'عمر',
  'سلمى',
  'يوسف',
  'ليلى',
  'كريم',
  'ندى',
  'مصطفى',
  'ياسمين',
  'علي',
  'ملك',
  'حسن',
  'جنى',
  'طارق',
  'فرح',
  'خالد',
  'هنا',
];
const familyNames = [
  'أحمد',
  'محمود',
  'حسن',
  'إبراهيم',
  'منصور',
  'عبدالله',
  'سعيد',
  'عمر',
  'فؤاد',
  'عادل',
  'يوسف',
  'علي',
  'كمال',
  'سامي',
  'رشاد',
  'فريد',
  'ناصر',
  'مجدي',
  'لطفي',
  'شريف',
];
const occupations = [
  'مهندس',
  'طبيب',
  'محاسب',
  'مصمم جرافيك',
  'مدرس',
  'مدير مبيعات',
  'مطور برمجيات',
  'باحث جامعي',
  'محلل بيانات',
  'صيدلي',
];
const amenities = [
  'مصعد، حارس للعقار، وعداد كهرباء مستقل.',
  'تكييف مركزي، مطبخ مجهز، وموقف سيارات.',
  'شرفة واسعة، إنترنت ألياف ضوئية، ومدخل آمن.',
  'قريب من الخدمات والمواصلات، وتشطيب عملي.',
  'إضاءة طبيعية، تخزين جيد، ومناطق مشتركة نظيفة.',
  'مناسب للعائلات، مع حراسة وموقف سيارات.',
];
const descriptions = [
  'عقار بإضاءة طبيعية ومساحات عملية في منطقة هادئة قريبة من الخدمات اليومية.',
  'وحدة سكنية بتقسيم مريح وتشطيب جيد، مناسبة للسكن طويل الأجل.',
  'مساحة مريحة بتصميم عملي بالقرب من المواصلات والمدارس والخدمات.',
  'عقار مرتب في حي سكني هادئ مع سهولة الوصول إلى الطرق الرئيسية.',
  'وحدة مناسبة للأفراد أو العائلات، مع توزيع جيد للغرف ومساحة معيشة مشرقة.',
  'سكن مريح بخدمات قريبة ومرافق أساسية، والتفاصيل موضحة في بيانات الإعلان.',
];
const images = [
  {
    url: '/property-images/bright-apartment-living-room.jpg',
    alt: 'غرفة معيشة مشرقة في شقة سكنية',
  },
  { url: '/property-images/furnished-apartment.jpeg', alt: 'شقة مفروشة بتصميم هادئ' },
  { url: '/property-images/apartment-living-room.jpg', alt: 'مساحة معيشة عصرية' },
];
const requestMessages = [
  'مرحباً، أرغب في معرفة المزيد عن العقار وموعد المعاينة المتاح.',
  'العقار مناسب لاحتياجاتنا. هل يمكن ترتيب موعد لمعاينته؟',
  'أبحث عن سكن بالقرب من العمل، ويسعدني معرفة تفاصيل الوحدة.',
  'هل العقار متاح من بداية الشهر القادم؟ شكراً لكم.',
];

function deterministicId(kind, index) {
  const digest = createHash('sha256').update(`${seedPrefix}:${kind}:${index}`).digest();
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function boundedItem(values, index) {
  return values[index % values.length];
}

function tenantDetails(index) {
  const name = `${boundedItem(firstNames, index * 7)} ${boundedItem(familyNames, index * 11 + 3)}`;
  const livingArrangement = ['alone', 'couple', 'family'][index % 3];
  return {
    name,
    occupation: boundedItem(occupations, index * 3 + 1),
    isStudent: index % 9 === 0,
    livingArrangement,
    familySize:
      livingArrangement === 'alone' ? 1 : livingArrangement === 'couple' ? 2 : 3 + (index % 3),
    moveInDate: new Date(now.getTime() + (15 + (index % 75)) * day),
    introduction: `باحث جاد عن سكن في ${boundedItem(communities, index).name}، وأهتم بالهدوء والقرب من الخدمات.`,
  };
}

function requestStatus(index) {
  if (index < 30) return 'ACCEPTED';
  if (index < 60) return 'PENDING';
  if (index < 75) return 'ON_HOLD';
  if (index < 100) return 'REJECTED';
  return 'EXPIRED';
}

function requestDates(index, status) {
  const ageDays =
    status === 'ACCEPTED'
      ? 2 + (index % 27)
      : status === 'REJECTED'
        ? 1 + (index % 15)
        : status === 'EXPIRED'
          ? 1 + (index % 12)
          : index % 5;
  const createdAt = new Date(now.getTime() - ageDays * day - (index % 12) * 60 * 60 * 1000);
  const expiresAt = new Date(createdAt.getTime() + 12 * 60 * 60 * 1000);
  return {
    createdAt,
    expiresAt,
    decidedAt: ['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(status) ? expiresAt : null,
  };
}

function profileSnapshot(profile) {
  return {
    name: profile.name,
    occupation: profile.occupation,
    isStudent: profile.isStudent,
    livingArrangement: profile.livingArrangement,
    familySize: profile.familySize,
    moveInDate: profile.moveInDate.toISOString().slice(0, 10),
    introduction: profile.introduction,
  };
}

function assertLocalDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required to seed the local demo database.');
  const parsedUrl = new URL(databaseUrl);
  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
  if (!localHosts.has(parsedUrl.hostname)) {
    throw new Error('Demo seed is restricted to a local PostgreSQL host. No data was written.');
  }
}

async function main() {
  assertLocalDatabaseUrl();

  const owners = Array.from({ length: 30 }, (_, index) => ({
    id: deterministicId('owner', index),
    email: `demo.owner.${String(index + 1).padStart(3, '0')}@example.test`,
    roles: ['OWNER'],
    createdAt: new Date(now.getTime() - (60 + index) * day),
  }));
  const tenants = Array.from({ length: 120 }, (_, index) => ({
    id: deterministicId('tenant', index),
    email: `demo.tenant.${String(index + 1).padStart(3, '0')}@example.test`,
    roles: ['TENANT'],
    createdAt: new Date(now.getTime() - (45 + index) * day),
  }));
  const profiles = tenants.map((tenant, index) => ({
    id: deterministicId('profile', index),
    userId: tenant.id,
    ...tenantDetails(index),
    avatarUrl: null,
    updatedAt: now,
  }));
  const tenantIndexById = new Map(tenants.map((tenant, index) => [tenant.id, index]));
  const propertyRecords = Array.from({ length: 300 }, (_, index) => {
    const community = boundedItem(communities, index * 7 + Math.floor(index / 5));
    const kind = boundedItem(propertyKinds, index * 5 + 2);
    const id = deterministicId('property', index);
    const ownerIndex = index % owners.length;
    const propertyStatus = index < 30 ? 'WITHDRAWN' : 'PUBLISHED';
    const createdAt = new Date(now.getTime() - (index % 120) * day - (index % 9) * 60 * 60 * 1000);
    const imageSet = [images[index % images.length], images[(index + 1) % images.length]];
    const title = `${kind.label} ${community.name} ${index + 1}`;

    return {
      id,
      ownerId: owners[ownerIndex].id,
      title,
      type: kind.type,
      community: community.name,
      bedrooms: kind.rooms + (index % 4 === 0 ? 1 : 0),
      bathrooms: kind.type === 'ROOM' ? 1 : kind.rooms >= 3 ? 2 + (index % 2) : 1 + (index % 2),
      area: kind.area + (index % 41),
      areaUnit: 'm²',
      furnishing: boundedItem(furnishings, index * 3 + 1),
      rent: Math.round((community.baseRent * kind.factor * (90 + (index % 31))) / 100 / 100) * 100,
      currency: 'EGP',
      rentPeriod: 'MONTH',
      availabilityDate: new Date(now.getTime() + (index % 90) * day),
      description: `${boundedItem(descriptions, index * 2)} ${boundedItem(amenities, index * 3 + 1)}`,
      images: imageSet,
      approximateLocation: `${community.name}، ${community.city}`,
      address: `عنوان تجريبي ${index + 1}، ${community.name}، ${community.city}`,
      additionalInfo: boundedItem(amenities, index + 2),
      status: propertyStatus,
      createdAt,
      updatedAt: createdAt,
      location: {
        propertyId: id,
        latitude: (community.lat + ((index % 17) - 8) * 0.0017).toFixed(7),
        longitude: (community.lng + ((index % 19) - 9) * 0.0016).toFixed(7),
      },
    };
  });
  const requestRecords = Array.from({ length: 120 }, (_, index) => {
    const tenant = tenants[index];
    const property = propertyRecords[index];
    const status = requestStatus(index);
    const dates = requestDates(index, status);
    const profile = profiles[index];
    return {
      id: deterministicId('request', index),
      tenantId: tenant.id,
      ownerId: property.ownerId,
      propertyId: property.id,
      profileSnapshot: profileSnapshot(profile),
      message: boundedItem(requestMessages, index),
      status,
      rejectionReason: status === 'REJECTED' ? (index % 2 === 0 ? 'PROFILE' : 'UNAVAILABLE') : null,
      connectsReserved: 1,
      ...dates,
    };
  });

  const walletByTenant = tenants.map((tenant, index) => {
    const related = requestRecords.filter((request) => request.tenantId === tenant.id);
    const accepted = related.filter((request) => request.status === 'ACCEPTED').length;
    const active = related.filter((request) =>
      ['PENDING', 'ON_HOLD'].includes(request.status),
    ).length;
    return {
      id: deterministicId('wallet', index),
      userId: tenant.id,
      available: 10 - accepted - active,
      reserved: active,
      updatedAt: now,
    };
  });
  const walletIdByTenant = new Map(walletByTenant.map((wallet) => [wallet.userId, wallet.id]));
  const walletEntries = [];
  for (let index = 0; index < tenants.length; index += 1) {
    const tenant = tenants[index];
    const wallet = walletByTenant[index];
    walletEntries.push({
      id: deterministicId('ledger-grant', index),
      walletId: wallet.id,
      requestId: null,
      availableChange: 10,
      reservedChange: 0,
      reason: 'GRANT',
      createdAt: new Date(tenant.createdAt.getTime() + 60 * 60 * 1000),
    });
  }
  for (let index = 0; index < requestRecords.length; index += 1) {
    const request = requestRecords[index];
    const walletId = walletIdByTenant.get(request.tenantId);
    const reservedAt = new Date(request.createdAt.getTime() + 1_000);
    walletEntries.push({
      id: deterministicId('ledger-reserve', index),
      walletId,
      requestId: request.id,
      availableChange: -1,
      reservedChange: 1,
      reason: 'REQUEST_RESERVE',
      createdAt: reservedAt,
    });
    if (['ACCEPTED', 'REJECTED', 'EXPIRED'].includes(request.status)) {
      const isAccepted = request.status === 'ACCEPTED';
      walletEntries.push({
        id: deterministicId(isAccepted ? 'ledger-consume' : 'ledger-refund', index),
        walletId,
        requestId: request.id,
        availableChange: isAccepted ? 0 : 1,
        reservedChange: -1,
        reason: isAccepted ? 'REQUEST_CONSUME' : 'REQUEST_REFUND',
        createdAt: new Date(request.decidedAt.getTime() + 1_000),
      });
    }
  }

  const messages = [];
  for (let index = 0; index < requestRecords.length; index += 1) {
    const request = requestRecords[index];
    if (!['ACCEPTED', 'PENDING', 'ON_HOLD'].includes(request.status)) continue;
    const tenant = tenants[index];
    messages.push({
      id: deterministicId('message-tenant', index),
      requestId: request.id,
      senderId: tenant.id,
      body: request.message,
      createdAt: new Date(request.createdAt.getTime() + 2 * 60 * 1000),
    });
    if (request.status === 'ACCEPTED') {
      messages.push({
        id: deterministicId('message-owner', index),
        requestId: request.id,
        senderId: request.ownerId,
        body: 'أهلاً بك، يسعدني ترتيب موعد للمعاينة. أخبرني بالوقت المناسب لك.',
        createdAt: new Date(request.createdAt.getTime() + 8 * 60 * 1000),
      });
    }
  }

  const notifications = [];
  for (let index = 0; index < requestRecords.length; index += 1) {
    const request = requestRecords[index];
    const tenant = tenants[index];
    const property = propertyRecords[index];
    if (request.status === 'ACCEPTED') {
      notifications.push({
        id: deterministicId('notification-tenant', index),
        userId: tenant.id,
        title: 'Request accepted',
        body: 'Your request was accepted. You can now start a private conversation.',
        targetUrl: `/requests/${request.id}/chat`,
        readAt: null,
        createdAt: request.decidedAt,
      });
    }
    if (['PENDING', 'ON_HOLD'].includes(request.status)) {
      notifications.push({
        id: deterministicId('notification-owner', index),
        userId: request.ownerId,
        title: 'New rental request',
        body: `A tenant sent a request for ${property.title}. Review this request.`,
        targetUrl: '/requests',
        readAt: null,
        createdAt: request.createdAt,
      });
    }
  }

  const inserted = await prisma.$transaction([
    prisma.user.createMany({ data: [...owners, ...tenants], skipDuplicates: true }),
    prisma.tenantProfile.createMany({ data: profiles, skipDuplicates: true }),
    prisma.connectWallet.createMany({ data: walletByTenant, skipDuplicates: true }),
    prisma.property.createMany({
      data: propertyRecords.map(({ location, ...property }) => property),
      skipDuplicates: true,
    }),
    prisma.propertyLocation.createMany({
      data: propertyRecords.map(({ location }) => location),
      skipDuplicates: true,
    }),
    prisma.rentalRequest.createMany({ data: requestRecords, skipDuplicates: true }),
    prisma.walletLedgerEntry.createMany({ data: walletEntries, skipDuplicates: true }),
    prisma.rentalMessage.createMany({ data: messages, skipDuplicates: true }),
    prisma.notification.createMany({ data: notifications, skipDuplicates: true }),
  ]);

  const seededPublishedProperties = await prisma.property.count({
    where: {
      id: { in: propertyRecords.map((property) => property.id) },
      status: 'PUBLISHED',
    },
  });
  const totalPublishedProperties = await prisma.property.count({ where: { status: 'PUBLISHED' } });

  console.log('Local demo seed completed (additive and safe to rerun).');
  console.log(`Inserted users: ${inserted[0].count}`);
  console.log(`Inserted tenant profiles: ${inserted[1].count}`);
  console.log(`Inserted wallets: ${inserted[2].count}`);
  console.log(`Inserted properties: ${inserted[3].count} (270 published, 30 withdrawn)`);
  console.log(`Inserted exact private map locations: ${inserted[4].count}`);
  console.log(
    `Inserted requests: ${inserted[5].count} (30 accepted, 30 pending, 15 on hold, 25 rejected, 20 expired)`,
  );
  console.log(`Inserted wallet ledger entries: ${inserted[6].count}`);
  console.log(`Inserted chat messages: ${inserted[7].count}`);
  console.log(`Inserted notifications: ${inserted[8].count}`);
  console.log(`Seeded published properties available in browse: ${seededPublishedProperties}`);
  console.log(`All published properties in this database: ${totalPublishedProperties}`);
}

main()
  .catch((error) => {
    console.error('Local demo seed failed. No existing records were deleted or overwritten.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

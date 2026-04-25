#!/usr/bin/env node
// Top-level seed orchestrator. Idempotent — safe to re-run.
//
//   node scripts/seed/run.mjs                 (everything)
//   node scripts/seed/run.mjs personas        (just personas + posts/reels)
//   node scripts/seed/run.mjs businesses
//   node scripts/seed/run.mjs groups
//   node scripts/seed/run.mjs officials
//   node scripts/seed/run.mjs knect-tv        (Mux uploads — ~3 min)
//   node scripts/seed/run.mjs events
//   node scripts/seed/run.mjs ads             (Mux ads only)

import path from 'node:path';
import {
  supabase, slugify, shortHash, uploadFile, uploadToMux,
  createUserWithProfile, getCityIdBySlug, listFiles, firstFile, getUploadCount,
} from './lib.mjs';
import { PERSONAS, BUSINESSES, GROUPS } from './personas.mjs';

const args = process.argv.slice(2);
const wants = (k) => args.length === 0 || args.includes(k);

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.bmp'];
const VIDEO_EXTS = ['.mp4', '.mov', '.m4v'];

function pickAvatarKey(handle, file) {
  return `${handle}/avatar${path.extname(file).toLowerCase()}`;
}

// ─── Personas ──────────────────────────────────────────────────────────────
async function seedPersonas() {
  console.log('\n=== Personas + posts + reels ===');
  for (const p of PERSONAS) {
    const cityId = p.citySlug ? await getCityIdBySlug(p.citySlug) : null;

    // Upload avatar — pick first image in folder.
    const firstImg = firstFile(p.folder, IMAGE_EXTS);
    let avatarUrl = null;
    if (firstImg) {
      const key = `${p.handle}/avatar-${shortHash(firstImg)}${path.extname(firstImg).toLowerCase()}`;
      avatarUrl = await uploadFile(firstImg, 'profile-avatars', key);
    }

    const profile = await createUserWithProfile({
      email: `${p.handle}@hubcity.test`,
      handle: p.handle,
      displayName: p.displayName,
      role: p.role,
      cityId,
      cityName: p.citySlug ? p.displayName.includes('LA') ? 'Los Angeles' : null : null,
      avatarUrl,
      bio: p.bio,
      isCreator: p.isCreator !== false,
      followerCount: p.followerCount ?? 0,
      websiteUrl: p.websiteUrl ?? null,
      socialLinks: p.socialLinks ?? {},
    });

    // Update channel: subscription price + content_scope + city.
    await supabase.from('channels').update({
      city_id: cityId,
      content_scope: p.contentScope ?? (p.citySlug ? 'local' : 'national'),
      subscription_price_cents: p.subscriptionPriceCents ?? null,
    }).eq('owner_id', profile.id);

    // Create posts from images.
    const images = listFiles(p.folder, IMAGE_EXTS);
    let postIdx = 0;
    let postsCreated = 0;
    for (const img of images) {
      const key = `${p.handle}/${path.basename(img).replace(/\s+/g, '-').toLowerCase()}`;
      const imgUrl = await uploadFile(img, 'post-images', key);
      if (!imgUrl) continue;
      const body = postCaptionFor(p, postIdx++);
      const exists = await supabase.from('posts').select('id').eq('image_url', imgUrl).maybeSingle();
      if (exists.data?.id) continue;
      const { error: pIErr } = await supabase.from('posts').insert({
        author_id: profile.id,
        body,
        image_url: imgUrl,
        media_type: 'image',
        city_id: cityId,
        content_scope: p.contentScope ?? (p.citySlug ? 'local' : 'national'),
        is_published: true,
      });
      if (pIErr) { console.error(`    ! post insert: ${pIErr.message}`); continue; }
      postsCreated++;
    }

    // Create reels from videos.
    const videos = listFiles(p.folder, VIDEO_EXTS);
    let reelIdx = 0;
    let reelsCreated = 0;
    for (const v of videos) {
      const filename = path.basename(v).replace(/\s+/g, '-').toLowerCase();
      const key = `${p.handle}/${filename}`;
      const vUrl = await uploadFile(v, 'reels', key);
      if (!vUrl) continue;
      const caption = reelCaptionFor(p, reelIdx++);
      const reelPath = `${p.handle}/${filename}`;
      const reelExists = await supabase.from('reels').select('id').eq('video_path', reelPath).maybeSingle();
      if (reelExists.data?.id) { reelsCreated++; continue; }
      const { error: rErr } = await supabase.from('reels').insert({
        author_id: profile.id,
        video_url: vUrl,
        video_path: reelPath,
        caption,
        city_id: cityId,
        content_scope: p.contentScope ?? (p.citySlug ? 'local' : 'national'),
        is_published: true,
      });
      if (rErr) { console.error(`    ! reel insert: ${rErr.message}`); continue; }
      reelsCreated++;
    }

    console.log(`  ✓ ${p.handle}: ${postsCreated} posts, ${reelsCreated} moments`);
  }
}

function postCaptionFor(p, i) {
  const captions = [
    `${p.displayName} — fresh post.`,
    `New from ${p.displayName}.`,
    `${p.displayName} dropping daily.`,
    `Tap in. ${p.displayName}.`,
    `From the lens of ${p.displayName}.`,
  ];
  return captions[i % captions.length];
}

function reelCaptionFor(p, i) {
  const captions = [
    `Moment captured. ${p.displayName}.`,
    `${p.displayName} — record a moment.`,
    `Hub City moment.`,
    `Real time. Real people.`,
    `${p.displayName} live look.`,
  ];
  return captions[i % captions.length];
}

// ─── Businesses ────────────────────────────────────────────────────────────
async function seedBusinesses() {
  console.log('\n=== Businesses ===');
  for (const b of BUSINESSES) {
    const cityId = await getCityIdBySlug(b.citySlug);

    // Create owner profile if it doesn't exist.
    const ownerEmail = `${b.ownerHandle}@hubcity.test`;
    const owner = await createUserWithProfile({
      email: ownerEmail,
      handle: b.ownerHandle,
      displayName: b.ownerName,
      role: 'business_owner',
      cityId,
      bio: b.ownerBio ?? null,
      isCreator: false,
    });

    // Upload images for the business.
    const images = listFiles(b.folder, IMAGE_EXTS);
    const imageUrls = [];
    for (const img of images.slice(0, 12)) {
      const key = `${b.slug}/${path.basename(img).replace(/\s+/g, '-').toLowerCase()}`;
      const url = await uploadFile(img, 'business-images', key);
      if (url) imageUrls.push(url);
    }

    // Upsert business.
    const { data: existing } = await supabase.from('businesses').select('id').eq('slug', b.slug).maybeSingle();
    const row = {
      slug: b.slug,
      name: b.name,
      category: b.category,
      description: b.description,
      address: b.address,
      city_id: cityId,
      owner_id: owner.id,
      image_urls: imageUrls,
      is_published: true,
      is_featured: true,
      content_scope: 'local',
    };
    if (existing?.id) {
      await supabase.from('businesses').update(row).eq('id', existing.id);
    } else {
      await supabase.from('businesses').insert(row);
    }

    // Also publish a few posts on behalf of the business owner so the feed
    // shows their content.
    let i = 0;
    for (const img of images.slice(0, 6)) {
      const key = `${b.ownerHandle}/${path.basename(img).replace(/\s+/g, '-').toLowerCase()}-feed`;
      const url = await uploadFile(img, 'post-images', key);
      if (!url) continue;
      const ex = await supabase.from('posts').select('id').eq('image_url', url).maybeSingle();
      if (!ex.data?.id) {
        await supabase.from('posts').insert({
          author_id: owner.id,
          body: `${b.name} — ${['fresh drop','new in','today','this week','tap in','support local'][i % 6]}`,
          image_url: url,
          media_type: 'image',
          city_id: cityId,
          content_scope: 'local',
          is_published: true,
        });
      }
      i++;
    }

    // Reels for business.
    const vids = listFiles(b.folder, VIDEO_EXTS);
    let vCount = 0;
    for (const v of vids) {
      const filename = path.basename(v).replace(/\s+/g, '-').toLowerCase();
      const key = `${b.ownerHandle}/${filename}`;
      const vUrl = await uploadFile(v, 'reels', key);
      if (!vUrl) continue;
      const rPath = `${b.ownerHandle}/${filename}`;
      const rEx = await supabase.from('reels').select('id').eq('video_path', rPath).maybeSingle();
      if (!rEx.data?.id) {
        await supabase.from('reels').insert({
          author_id: owner.id,
          video_url: vUrl,
          video_path: rPath,
          caption: `${b.name} — moment.`,
          city_id: cityId,
          content_scope: 'local',
          is_published: true,
        });
      }
      vCount++;
    }

    console.log(`  ✓ ${b.slug}: ${imageUrls.length} biz images, ${vCount} moments`);
  }
}

// ─── Groups ────────────────────────────────────────────────────────────────
async function seedGroups() {
  console.log('\n=== Community Groups ===');
  for (const g of GROUPS) {
    const cityId = await getCityIdBySlug(g.citySlug);

    let creatorId;
    if (g.createOwner) {
      const handle = g.creatorHandle;
      const ownerCityId = g.createOwner.citySlug ? await getCityIdBySlug(g.createOwner.citySlug) : cityId;
      const owner = await createUserWithProfile({
        email: `${handle}@hubcity.test`,
        handle,
        displayName: g.createOwner.displayName,
        role: g.createOwner.role,
        cityId: ownerCityId,
        bio: g.createOwner.bio,
        isCreator: true,
        followerCount: 1500,
      });
      creatorId = owner.id;
    } else {
      const { data: prof } = await supabase.from('profiles').select('id, role').eq('handle', g.creatorHandle).maybeSingle();
      if (!prof) {
        console.error(`  ! Group ${g.slug}: creator handle ${g.creatorHandle} not found`);
        continue;
      }
      creatorId = prof.id;
      // Some groups need their creator promoted to ambassador for RLS.
      if (g.creatorRoleOverride && prof.role !== g.creatorRoleOverride) {
        await supabase.from('profiles').update({ role: g.creatorRoleOverride }).eq('id', creatorId);
      }
    }

    // Avatar from first image.
    const firstImg = firstFile(g.folder, IMAGE_EXTS);
    let avatarUrl = null;
    if (firstImg) {
      const key = `${g.slug}/avatar-${shortHash(firstImg)}${path.extname(firstImg).toLowerCase()}`;
      avatarUrl = await uploadFile(firstImg, 'group-media', key);
    }

    const row = {
      slug: g.slug,
      name: g.name,
      category: g.category,
      city_id: cityId,
      created_by: creatorId,
      description: g.description,
      avatar_url: avatarUrl,
      image_url: avatarUrl,
      is_public: true,
      is_active: true,
      member_count: Math.floor(Math.random() * 800) + 200,
    };
    const { data: existing } = await supabase.from('community_groups').select('id').eq('slug', g.slug).maybeSingle();
    let groupId;
    if (existing?.id) {
      groupId = existing.id;
      await supabase.from('community_groups').update(row).eq('id', groupId);
    } else {
      const { data: ins, error: insErr } = await supabase.from('community_groups').insert(row).select('id').single();
      if (insErr) {
        console.error(`  ! Group ${g.slug}: ${insErr.message}`);
        continue;
      }
      groupId = ins.id;
    }

    // Add creator as group member (admin).
    await supabase.from('group_members').upsert({
      group_id: groupId,
      user_id: creatorId,
      role: 'admin',
    }, { onConflict: 'group_id,user_id' });

    // Upload group gallery from images + videos.
    const images = listFiles(g.folder, IMAGE_EXTS);
    let galleryCount = 0;
    for (const img of images) {
      const key = `${g.slug}/${path.basename(img).replace(/\s+/g, '-').toLowerCase()}`;
      const url = await uploadFile(img, 'group-media', key);
      if (!url) continue;
      const gEx = await supabase.from('group_gallery_items').select('id').eq('media_path', key).maybeSingle();
      if (!gEx.data?.id) {
        await supabase.from('group_gallery_items').insert({
          group_id: groupId,
          media_url: url,
          media_path: key,
          media_type: 'image',
          uploaded_by: creatorId,
        });
      }
      galleryCount++;
    }
    const vids = listFiles(g.folder, VIDEO_EXTS);
    let vCount = 0;
    for (const v of vids) {
      const filename = path.basename(v).replace(/\s+/g, '-').toLowerCase();
      const key = `${g.slug}/${filename}`;
      const vUrl = await uploadFile(v, 'reels', key);
      if (!vUrl) continue;
      const grPath = `${g.slug}/${filename}`;
      const grEx = await supabase.from('reels').select('id').eq('video_path', grPath).maybeSingle();
      if (!grEx.data?.id) {
        await supabase.from('reels').insert({
          author_id: creatorId,
          video_url: vUrl,
          video_path: grPath,
          caption: `${g.name} — moment.`,
          city_id: cityId,
          group_id: groupId,
          content_scope: 'local',
          is_published: true,
        });
      }
      vCount++;
    }

    console.log(`  ✓ ${g.slug}: ${galleryCount} gallery items, ${vCount} moments`);
  }
}

// ─── Civic Officials ───────────────────────────────────────────────────────
const OFFICIALS = [
  { name: 'Emma Sharif',           title: 'Mayor',                     official_type: 'mayor',          file: 'Emma Sharif.jpeg' },
  { name: 'Andre Spicer',          title: 'Council Member, District 1', official_type: 'council_member', district: 1, file: 'Andre Spicer.jpeg' },
  { name: 'Jonathan Bowers',       title: 'Council Member, District 2', official_type: 'council_member', district: 2, file: 'Jonathan Bowers.jpeg' },
  { name: 'Deidre Duhart',         title: 'Council Member, District 3', official_type: 'council_member', district: 3, file: 'Deidre Duhart.jpeg' },
  { name: 'Denzell O. Perry',      title: 'Council Member, District 4', official_type: 'council_member', district: 4, file: 'Denzell O. Perry.jpg' },
  { name: 'Willie Hopkins Jr.',    title: 'City Manager',              official_type: 'city_manager',   file: 'willie-hopkins-compton.jpeg' },
  { name: 'Alma K. Taylor',        title: 'City Clerk',                official_type: 'city_manager',   file: 'Alma Taylor.png' },
  { name: 'Dr. Darin Brawley',     title: 'Superintendent, CUSD',      official_type: 'superintendent', file: 'DrDarinBrawley.bmp' },
  { name: 'Micah Ali',             title: 'CUSD Board President',      official_type: 'board_president', trustee_area: 'A', file: 'Micah Ali.jpg' },
  { name: 'Sandra Moss',           title: 'CUSD Board VP',             official_type: 'board_vp',        trustee_area: 'B', file: 'Sandra Moss.png' },
  { name: 'Ayanna E. Davis',       title: 'CUSD Board Clerk',          official_type: 'board_clerk',     trustee_area: 'C', file: 'Ayanna E. Davis.jpg' },
  { name: 'Lillie Darden',         title: 'CUSD Board Member',         official_type: 'board_member',    trustee_area: 'D', file: 'Liilie Darden.png' },
  { name: 'Michael Hooper',        title: 'CUSD Board Member',         official_type: 'board_member',    trustee_area: 'E', file: 'Michael Hooper.jpg' },
  { name: 'City Clerk',            title: 'City Clerk\'s Office',      official_type: 'city_manager',    file: 'City Clerk.png' },
];

async function seedOfficials() {
  console.log('\n=== Civic Officials (Compton) ===');
  const cityId = await getCityIdBySlug('compton');
  const folder = '/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/Officials ';
  for (const o of OFFICIALS) {
    const localPath = path.join(folder, o.file);
    let photoUrl = null;
    try {
      const key = `compton/${slugify(o.name)}${path.extname(o.file).toLowerCase()}`;
      photoUrl = await uploadFile(localPath, 'profile-avatars', key);
    } catch (e) {
      console.error(`  ! ${o.name}: ${e.message}`);
      continue;
    }
    const row = {
      official_type: o.official_type,
      name: o.name,
      title: o.title,
      district: o.district ?? null,
      trustee_area: o.trustee_area ?? null,
      photo_url: photoUrl,
      city_id: cityId,
      is_voting_member: true,
      background: `${o.title} — ${o.name}.`,
    };
    // Idempotency: match on (city_id, name, title).
    const { data: existing } = await supabase
      .from('civic_officials')
      .select('id')
      .eq('city_id', cityId)
      .eq('name', o.name)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from('civic_officials').update(row).eq('id', existing.id);
    } else {
      await supabase.from('civic_officials').insert(row);
    }
    console.log(`  ✓ ${o.name}`);
  }
}

// ─── Culture channel (Mux uploads) ─────────────────────────────────────────
const KNECT_VIDEOS = [
  {
    title: 'BILLS — A Short Film on the Making of a Monster',
    description: 'A short film on the making of a monster.',
    file: '/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/knect tv/BILLS A short film on the making of a monster.mp4',
    access_type: 'free',
  },
  {
    title: 'Compton Av, Steelz, Snoop Dogg & 310babii — YAYA (Remix)',
    description: 'Official video. Compton in motion.',
    file: '/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/knect tv/Compton Av, Steelz, Snoop Dogg & 310babii - YAYA (Remix) (Official Video).mp4',
    access_type: 'free',
    is_featured: true,
  },
  {
    title: "I'm Not Scared of Y.Ns — Mario Tory at Chocolate Sundaes",
    description: 'Stand-up at Chocolate Sundaes Comedy.',
    file: "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/knect tv/I'm Not Scared of Y.Ns - Comedian Mario Tory - Chocolate Sundaes Stand Up Comedy.mp4",
    access_type: 'subscribers',
  },
  {
    title: 'THE EBONY WITCH (Pilot)',
    description: 'Pilot episode of The Ebony Witch.',
    file: '/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/knect tv/THE EBONY WITCH (PILOT).mp4',
    access_type: 'ppv',
    price_cents: 299,
  },
];

const KNECT_TRACKS = [
  {
    artist: 'Drake feat. Tems',
    title: 'Lost in Lagos',
    file: '/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/knect tv/music/Drake feat Tems. - Lost in Lagos❤.mp3',
    genre_slug: 'hip-hop',
    access_type: 'free',
  },
  {
    artist: 'GIVĒON',
    title: 'I Can Tell',
    file: '/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/knect tv/music/GIVĒON - I CAN TELL (Official Audio).mp3',
    genre_slug: 'r-b-soul',
    access_type: 'subscribers',
  },
  {
    artist: 'Kehlani feat. Usher',
    title: 'Shoulda Never',
    file: '/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/knect tv/music/Kehlani - Shoulda Never (feat. Usher) [Official Audio].mp3',
    genre_slug: 'r-b-soul',
    access_type: 'free',
  },
];

async function seedKnectTV() {
  console.log('\n=== Culture channel (Mux uploads) ===');

  // Owner profile.
  const owner = await createUserWithProfile({
    email: 'culture@hubcity.test',
    handle: 'culture',
    displayName: 'Culture',
    role: 'content_creator',
    cityId: await getCityIdBySlug('compton'),
    bio: 'The streaming home of Hub City film, music, and comedy.',
    isCreator: true,
    followerCount: 24000,
    websiteUrl: 'https://hubcity.app/culture',
  });

  // Channel: bring it under one umbrella + price subscriptions.
  await supabase.from('channels').update({
    name: 'Culture',
    description: 'Long-form film, music, and comedy from the Hub City and beyond.',
    type: 'media',
    subscription_price_cents: 999,
    subscription_currency: 'usd',
    is_verified: true,
    content_scope: 'national',
  }).eq('owner_id', owner.id);
  const { data: ch } = await supabase.from('channels').select('id').eq('owner_id', owner.id).single();

  // ── Channel videos ──────────────────────────────────────────────
  for (const v of KNECT_VIDEOS) {
    const slug = slugify(v.title);
    const { data: existing } = await supabase.from('channel_videos').select('id, mux_playback_id').eq('channel_id', ch.id).eq('title', v.title).maybeSingle();
    if (existing?.mux_playback_id) {
      console.log(`  · ${v.title}: already uploaded`);
      continue;
    }
    console.log(`  ↑ ${v.title} → Mux …`);
    const mux = await uploadToMux(v.file, { label: slug });
    const row = {
      channel_id: ch.id,
      title: v.title,
      description: v.description,
      mux_asset_id: mux.asset_id,
      mux_playback_id: mux.playback_id,
      duration: mux.duration_seconds,
      thumbnail_url: `https://image.mux.com/${mux.playback_id}/thumbnail.jpg?width=800&height=450&fit_mode=smartcrop`,
      status: 'ready',
      is_published: true,
      published_at: new Date().toISOString(),
      access_type: v.access_type,
      price_cents: v.price_cents ?? null,
      is_premium: v.access_type === 'ppv',
      is_featured: !!v.is_featured,
      video_type: 'on_demand',
    };
    if (existing?.id) {
      await supabase.from('channel_videos').update(row).eq('id', existing.id);
    } else {
      await supabase.from('channel_videos').insert(row);
    }
    console.log(`    ✓ ${v.title}`);
  }

  // ── Tracks → albums (one single per track) ─────────────────────
  for (const t of KNECT_TRACKS) {
    const albumSlug = `culture-${slugify(t.title)}`;
    const trackTitle = t.title;
    const { data: existingAlbum } = await supabase.from('albums').select('id').eq('slug', albumSlug).maybeSingle();
    if (existingAlbum?.id) {
      const { data: existingTrack } = await supabase.from('tracks').select('id, mux_playback_id').eq('album_id', existingAlbum.id).eq('title', trackTitle).maybeSingle();
      if (existingTrack?.mux_playback_id) {
        console.log(`  · ${t.title}: already uploaded`);
        continue;
      }
    }
    console.log(`  ↑ ${t.title} → Mux (audio) …`);
    const mux = await uploadToMux(t.file, { audioOnly: true, label: albumSlug });

    // Create album.
    const albumRow = {
      slug: albumSlug,
      title: trackTitle,
      description: `${t.artist} — ${trackTitle}`,
      release_type: 'single',
      genre_slug: t.genre_slug,
      access_type: t.access_type,
      cover_art_url: null,
      channel_id: ch.id,
      creator_id: owner.id,
      is_published: true,
      release_date: new Date().toISOString().slice(0, 10),
    };
    let albumId;
    if (existingAlbum?.id) {
      albumId = existingAlbum.id;
      await supabase.from('albums').update(albumRow).eq('id', albumId);
    } else {
      const { data: ins, error: aErr } = await supabase.from('albums').insert(albumRow).select('id').single();
      if (aErr) throw aErr;
      albumId = ins.id;
    }

    const trackRow = {
      album_id: albumId,
      channel_id: ch.id,
      creator_id: owner.id,
      title: trackTitle,
      track_number: 1,
      mux_asset_id: mux.asset_id,
      mux_playback_id: mux.playback_id,
      mux_status: 'ready',
      duration_seconds: mux.duration_seconds,
      genre_slug: t.genre_slug,
      is_published: true,
      features: t.artist.includes('feat') ? [t.artist.split('feat.')[1]?.trim() ?? ''] : null,
    };
    const { data: existingTrack } = await supabase.from('tracks').select('id').eq('album_id', albumId).eq('title', trackTitle).maybeSingle();
    if (existingTrack?.id) {
      await supabase.from('tracks').update(trackRow).eq('id', existingTrack.id);
    } else {
      await supabase.from('tracks').insert(trackRow);
    }
    console.log(`    ✓ ${t.title}`);
  }
}

// ─── Ads (Mux video + audio) ───────────────────────────────────────────────
async function seedAds() {
  console.log('\n=== Ads (Mux video + audio) ===');
  // Find or create a Culture-owned advertiser profile.
  const { data: ownerProf } = await supabase.from('profiles').select('id').eq('handle', 'culture').maybeSingle();
  if (!ownerProf) {
    console.error('  ! culture profile not found — run knect-tv (culture) first');
    return;
  }

  // Campaign.
  const today = new Date();
  const end = new Date(today.getTime() + 365 * 86400 * 1000);
  let campaignId;
  const { data: existingCampaign } = await supabase.from('ad_campaigns').select('id').eq('name', 'Dog\'s Gonna Eat — house').maybeSingle();
  if (existingCampaign?.id) {
    campaignId = existingCampaign.id;
  } else {
    const { data: ins, error } = await supabase.from('ad_campaigns').insert({
      advertiser_id: ownerProf.id,
      owner_id: ownerProf.id,
      name: "Dog's Gonna Eat — house",
      title: "Dog's Gonna Eat",
      budget_cents: 100000,
      start_date: today.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      status: 'active',
      type: 'boost',
    }).select('id').single();
    if (error) throw error;
    campaignId = ins.id;
  }

  const VIDEO_AD = '/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/knect tv/Ads/Dog\'s Gonna Eat 30 - Test1.mp4';
  const AUDIO_AD = '/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/knect tv/music/Music Ad/Dog\'s Gonna Eat 30 - Test1.mp3';

  // Video creative.
  const { data: existingVid } = await supabase.from('ad_creatives').select('id, video_url').eq('campaign_id', campaignId).eq('ad_type', 'pre_roll').maybeSingle();
  if (!existingVid?.video_url) {
    console.log("  ↑ Dog's Gonna Eat (video) → Mux …");
    const muxV = await uploadToMux(VIDEO_AD, { label: 'video-ad' });
    const row = {
      campaign_id: campaignId,
      ad_type: 'pre_roll',
      title: "Dog's Gonna Eat",
      body: 'Hub City eats. Dog approved.',
      video_url: `https://stream.mux.com/${muxV.playback_id}.m3u8`,
      click_url: 'https://hubcity.app',
      duration_seconds: muxV.duration_seconds,
    };
    if (existingVid?.id) await supabase.from('ad_creatives').update(row).eq('id', existingVid.id);
    else await supabase.from('ad_creatives').insert(row);
    console.log(`    ✓ video creative ready`);
  } else {
    console.log("  · Video ad already exists");
  }

  // Audio creative.
  const { data: existingAud } = await supabase.from('ad_creatives').select('id, audio_url').eq('campaign_id', campaignId).eq('ad_type', 'audio_spot').maybeSingle();
  if (!existingAud?.audio_url) {
    console.log("  ↑ Dog's Gonna Eat (audio) → Mux …");
    const muxA = await uploadToMux(AUDIO_AD, { audioOnly: true, label: 'audio-ad' });
    const row = {
      campaign_id: campaignId,
      ad_type: 'audio_spot',
      title: "Dog's Gonna Eat",
      body: 'Hub City eats. Dog approved.',
      audio_url: `https://stream.mux.com/${muxA.playback_id}/audio.m4a`,
      click_url: 'https://hubcity.app',
      duration_seconds: muxA.duration_seconds,
    };
    if (existingAud?.id) await supabase.from('ad_creatives').update(row).eq('id', existingAud.id);
    else await supabase.from('ad_creatives').insert(row);
    console.log(`    ✓ audio creative ready`);
  } else {
    console.log("  · Audio ad already exists");
  }
}

// ─── Events (event flyers) ─────────────────────────────────────────────────
async function seedEvents() {
  console.log('\n=== Events ===');
  const folder = '/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/event flyers';
  const flyers = listFiles(folder, IMAGE_EXTS);
  if (flyers.length === 0) {
    console.log('  ! no flyers found');
    return;
  }
  // Get a creator id (use compton-advocate as the default poster).
  const { data: poster } = await supabase.from('profiles').select('id').eq('handle', 'compton-advocate').maybeSingle();
  if (!poster) { console.error('  ! poster not found'); return; }

  const cityCompton = await getCityIdBySlug('compton');
  const cityLA = await getCityIdBySlug('los-angeles');
  const cityLB = await getCityIdBySlug('long-beach');
  const cityIE = await getCityIdBySlug('riverside');

  const now = new Date();
  let eventCount = 0;
  for (let i = 0; i < flyers.length; i++) {
    const flyer = flyers[i];
    const filename = path.basename(flyer).replace(/\s+/g, '-').toLowerCase();
    const key = `flyers/${filename}`;
    const url = await uploadFile(flyer, 'media', key);
    if (!url) continue;
    eventCount++;

    // Distribute across cities.
    let cityId = cityCompton;
    if (i % 5 === 0) cityId = cityLA;
    else if (i % 7 === 0) cityId = cityLB;
    else if (i % 11 === 0) cityId = cityIE;

    const start = new Date(now.getTime() + (3 + i * 4) * 86400 * 1000);
    const slug = `event-${shortHash(filename, 8)}`;
    const titles = [
      'First Friday Pop-Up', 'Hub City Mixer', 'Block Party',
      'Cook-Off Night', 'Open Mic', 'Skate Jam',
      'Movie on the Lawn', 'Run Club Social', 'Vendor Fair',
      'Live Set', 'Family Day', 'Community Workshop',
    ];
    const row = {
      slug,
      title: titles[i % titles.length],
      description: `Hub City event — flyer #${i + 1}.`,
      category: 'community',
      start_date: start.toISOString().slice(0, 10),
      start_time: '18:00:00',
      city_id: cityId,
      image_url: url,
      created_by: poster.id,
      is_published: true,
      content_scope: 'local',
      address: 'TBA',
    };
    const { data: existing } = await supabase.from('events').select('id').eq('slug', slug).maybeSingle();
    if (existing?.id) await supabase.from('events').update(row).eq('id', existing.id);
    else await supabase.from('events').insert(row);
  }
  console.log(`  ✓ ${eventCount} events`);
}

// ─── Main ──────────────────────────────────────────────────────────────────
const t0 = Date.now();
try {
  if (wants('officials')) await seedOfficials();
  if (wants('personas')) await seedPersonas();
  if (wants('businesses')) await seedBusinesses();
  if (wants('groups')) await seedGroups();
  if (wants('knect-tv')) await seedKnectTV();
  if (wants('ads')) await seedAds();
  if (wants('events')) await seedEvents();
} catch (e) {
  console.error('\nSeed failed:', e?.stack || e);
  process.exit(1);
}
const dt = Math.round((Date.now() - t0) / 1000);
console.log(`\nDone in ${dt}s. Files uploaded: ${getUploadCount()}.`);

+++
title = "Building Digs, an offline Discogs companion"
description = "How I built a free, offline-first iOS app to browse my vinyl collection – and what I learned about building apps with AI."
date = 2026-03-22
slug = "building-digs"
+++

I’ve been collecting vinyl for years and [Discogs](https://www.discogs.com/) is where I catalog everything. But browsing my collection on the go never really worked for me. The official app is quite full of features, but some basics were missing for me: folder navigation, offline mode. I wanted something simpler, fast and offline to dig through my records, organized the way I already organize them on my shelves.

So I built [Digs](https://apps.apple.com/us/app/digs-for-discogs/id6760368825).

## What it does

It syncs your entire collection to your phone and lets you browse it offline. You still manage everything on Discogs. Digs just gives you a fast, mobile copy to dig through.

After the initial sync, your whole collection is available offline. You can browse by folder, search across artists, albums and labels, or hit the random picker to rediscover something you forgot you owned. Subsequent syncs are incremental – only what’s changed gets fetched.

I built this for a specific use case. If you organize your records into folders and want to quickly browse them without signal, it might be useful. If you want wantlist management, marketplace features, and digging through the many versions of a release this isn’t that.

## The tech

It’s a React Native app built with Expo and TypeScript. Data lives in SQLite, with Drizzle ORM on top. Authentication goes through the official Discogs API using OAuth, with tokens stored in the iOS Keychain.

I went with React Native and Expo because I know TypeScript and I don’t know Swift. This was my first mobile app and Expo lowered the barrier enough that I actually shipped it. A native SwiftUI app would probably have been smaller, but I wouldn’t have started at all. That said, Expo is great to get going but you do start feeling locked in. Their cloud build service EAS is the easy default, and at some point it’s the only one you know. Just something I didn’t think about early enough.

The sync pipeline was more interesting to build. It starts by fetching your folder structure, then does a paginated download of every release in your collection – artist, title, year, format, thumbnail. Once that’s done you can already browse everything. From there it progressively fetches full details for each release (tracklist, high-res images, ratings, videos) and caches images to disk. Each phase can be paused or cancelled, and the whole thing can run as a background task.

### Rate limiting

The rate limiter gave me the most trouble. Discogs allows 60 requests per minute. The naive approach, counting your requests and stopping at 60, doesn’t work when you have multiple requests in flight. By the time request 58 comes back and tells you you’ve hit the limit, requests 59 through 65 are already on their way.

The solution I found is a token-bucket limiter that accounts for in-flight requests. It watches the `X-Discogs-Ratelimit-Remaining` header on every response, tracks how many requests are currently pending, and adjusts. When tokens run out, it probes with a single request to refresh the count from the response header. If it does hit a 429, it backs off exponentially using the `Retry-After` header.

### Local-first architecture

All reads come from SQLite. I configured React Query with infinite stale time because the local DB is the source of truth, not a cache. In practice everything is instant: search, folder browsing, the random picker are all just SQLite queries.

## Building with Claude Code

I built the whole thing with [Claude Code](https://docs.anthropic.com/en/docs/claude-code). It took longer than I expected, but not how I expected.

The code part was fast. Claude Code is good at turning a clear idea into working code. What took time was figuring out what I actually wanted to build. Should sync be cancellable? Should the random picker filter by folder? Wantlists, yes or no? Editing, yes or no? Those product decisions are where I spent the most time. And then even once you know what you want and the code is written, you’re still testing on device, tweaking layouts, rethinking flows, going through App Store review. Making an app just takes time.

## Try it

Digs is free on the [App Store](https://apps.apple.com/us/app/digs-for-discogs/id6760368825). No ads, no tracking whatsoever, no account beyond your Discogs login.

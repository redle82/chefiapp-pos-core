# Phase 1 — Go-Live Runbook (Feb 28, 2025)

**Launch Date:** Friday, Feb 28, 2025  
**Launch Time:** 9:00 AM Berlin Time (8:00 AM UTC)  
**Team Lead:** [CTO/Tech Lead Name]  
**Ops Lead:** [DevOps Lead Name]  
**On-Call Engineer:** [Primary + Secondary]

---

## Pre-Launch (Feb 28, 6:00–9:00 AM)

### 6:00 AM — Status Check (Tech Lead + Ops)

**Checklist (MUST ALL BE ✅)**

- [ ] Main branch builds without errors
- [ ] All databases (PostgreSQL, Redis) running
- [ ] All monitoring dashboards load
- [ ] Marketplace sandboxes are up (status.justeat.com, etc.)
- [ ] Backups verified and restorable (test restore)
- [ ] On-call team alert channels working (Slack, PagerDuty)
- [ ] Load balancer health checks passing
- [ ] CDN cache cleared (if applicable)

**Action if ❌:**
- Stop. Do not proceed.
- Diagnose and fix.
- Delay launch to next Monday (Mar 3).
- Notify investors.

### 6:30 AM — Final Sanity Test (QA Lead)

**Run in production environment:**

```
1. Sign up as test restaurant "QA Test" 
   Expected: Email sent, confirmation link works
   
2. Add 3 menu items
   Expected: Items saved, prices correct
   
3. Publish page
   Expected: Page live at chefiapp.com/qa-test
   
4. Connect Just Eat (sandbox)
   Expected: OAuth succeeds, token stored
   
5. Send test order from Just Eat
   Expected: Order appears in TPV in <5 sec
   
6. Confirm order in TPV
   Expected: Status syncs to Just Eat in <5 sec
```

**If any FAIL:**
- Rollback immediately (see Rollback section)
- Diagnose
- Notify team
- Delay launch

**If all PASS:**
- Proceed to launch

### 7:00 AM — Team Standup

**Attendees:** Tech Lead, Product, Ops, QA, On-call engineer

**Each answers (2 min total):**
- "Are you ready?"
- "Any last-minute concerns?"

**Decision point:**
- **"GO"** → Proceed to 9 AM launch
- **"HOLD"** → Stop, diagnose, reschedule

---

## Launch (9:00 AM)

### 9:00 AM — Flip the Switch

**Tech Lead executes:**

1. **Announce in #chefiapp-phase1 Slack:**
   ```
   🚀 PHASE 1 LAUNCH STARTING
   9:00 AM — Begin inviting first batch of restaurants
   9:15 AM — Expect first sign-ups
   9:30 AM — Monitor metrics
   ```

2. **Send launch email to first 20 restaurants:**
   ```
   Subject: 🎉 ChefIApp is LIVE! Your orders start here.
   
   Dear Restaurant Owner,
   
   Welcome to Phase 1 of ChefIApp!
   
   Your sign-up link: chefiapp.com/phase1?code=RESTAURANT_CODE_HERE
   
   You'll be live and receiving orders within 5 minutes.
   
   Questions? Reply to this email or call +351 XXX XXX XXX
   
   Welcome aboard,
   ChefIApp Team
   ```

3. **Monitoring dashboard live:**
   - Open [chefiapp.com/admin/phase1-metrics](chefiapp.com/admin/phase1-metrics)
   - Keep running on big screen in war room
   - Refresh every 30 seconds

### 9:15 AM — Onboarding Begins

**QA Team Actions:**
- Monitor sign-up submissions in real-time
- Help first 5 restaurants via email/phone if needed
- Log any issues in #chefiapp-issues Slack

**Expected metrics (9:15–10:00 AM):**
- 10–20 sign-ups
- 8–16 email confirmations (95%+)
- 5–10 restaurants setting up menus

---

## Monitoring Window (9:00 AM–1:00 PM)

### Critical Metrics (Check Every 5 Minutes)

**Watch these like a hawk:**

| Metric | Target | Alarm If | Action |
|--------|--------|----------|--------|
| API uptime | 100% | <99.9% | Page on-call |
| Marketplace API latency | <2s | >5s | Contact marketplace support |
| Sign-up success rate | 95%+ | <90% | Check email delivery |
| Order sync latency | <5s | >10s | Check adapter logs |
| Database CPU | <70% | >80% | Scale database |
| Error rate | <0.1% | >0.5% | Investigate errors |

### Slack Updates (Hourly)

**9:00 AM update:**
```
🚀 LAUNCH: 0 restaurants live
- 0 sign-ups so far
- Marketplace adapters: ✅ UP
- API: ✅ UP
- Next update: 10:00 AM
```

**10:00 AM update:**
```
📊 1 HOUR IN: 15 restaurants live
- 20 sign-ups, 18 confirmed, 15 published
- 3 marketplace connections
- 1 order received (Just Eat)
- All systems: ✅ GREEN
- Next update: 11:00 AM
```

**11:00 AM, 12:00 PM updates:** Same format

---

## Common Issues & Immediate Actions

### 🔴 Issue: Email delivery failing (sign-ups piling up unconfirmed)

**Immediate action (2 min):**
1. Check email provider status (Sendgrid, AWS SES)
2. Check email logs: `tail -f /var/log/chefiapp/email.log`
3. Verify SMTP credentials in config

**If still broken (5 min):**
1. Switch to backup email provider (if available)
2. Send manual confirmation emails to restaurants
3. Notify restaurants: "Slight email delay, we're on it"

**If >15 min not fixed:**
1. Page on-call engineer
2. Consider rollback (see Rollback section)

---

### 🔴 Issue: Marketplace adapter not receiving orders

**Immediate action (2 min):**
1. Check if webhook is enabled in Just Eat dashboard
2. Verify webhook URL is correct (should be prod)
3. Test with manual order in marketplace sandbox

**If issue persists (5 min):**
1. Switch to polling mode (temporary, higher latency)
2. Check adapter logs: `tail -f /var/log/chefiapp/adapters.log`
3. Contact Just Eat support (have API key ready)

**If >10 min not fixed:**
1. Page on-call engineer
2. Disable that marketplace adapter (restaurants won't see it)
3. Notify restaurants: "Just Eat temporarily offline, we're fixing it"

---

### 🔴 Issue: Database running out of disk space

**Immediate action (1 min):**
1. Check disk usage: `df -h`
2. If >85%, delete old logs: `rm /var/log/chefiapp/*.log.old`

**If still >85% (2 min):**
1. Scale database storage (if cloud)
2. Page on-call engineer

**If database stops responding:**
1. Failover to replica (if available)
2. Page on-call engineer IMMEDIATELY
3. Prepare for rollback

---

### 🟡 Issue: Slow order sync (>5s latency)

**Check (2 min):**
1. Is traffic spiking? (Check metrics dashboard)
2. Is a marketplace API slow? (Check status pages)
3. Is database slow? (Check query logs)

**Action:**
1. If traffic spiking: Enable auto-scaling
2. If marketplace slow: Check with them; document delay
3. If database slow: Check slow query log, optimize or scale

**Do NOT rollback for slowness** (only if orders not syncing at all)

---

### 🟡 Issue: Duplicate orders appearing

**Immediate action (3 min):**
1. Check if webhook is being retried: `grep -c "webhook_id=X" /var/log/chefiapp/adapters.log`
2. Check if order IDs are being deduped correctly

**If duplicates confirmed:**
1. Check marketplace webhook retention (some platforms retry forever)
2. Implement stricter deduplication
3. Notify affected restaurants (apologize + delete duplicate)

**Do NOT rollback for duplicates** (handle case-by-case)

---

## If You Need to Rollback (Last Resort)

**Rollback is a 30–60 minute process. Only do if:**
- API completely down (not recoverable in 15 min)
- Database corrupted (restores are failing)
- Security breach detected
- More than 50% of orders affected

### Rollback Procedure (Ops Lead)

**Step 1: Announce (1 min)**
```
#chefiapp-crisis: 🔴 ROLLBACK INITIATED
Reason: [brief description]
ETA to resolution: 30 min
```

**Step 2: Stop new traffic (1 min)**
1. Load balancer: Route all traffic to static "maintenance page"
2. Disable marketplace webhooks (prevent order influx during rollback)

**Step 3: Restore database (10–15 min)**
1. Stop application servers
2. Restore PostgreSQL from latest backup (pre-launch)
3. Restore Redis (events)
4. Verify data integrity (sample queries)

**Step 4: Start services (5 min)**
1. Start application servers
2. Wait for health checks to pass
3. Verify logs show no errors

**Step 5: Resume traffic (1 min)**
1. Load balancer: Route to application servers
2. Monitor error rate (should be 0)

**Step 6: Communicate (2 min)**
```
#chefiapp-crisis: ✅ ROLLBACK COMPLETE
- We restored from Feb 28, 6:00 AM backup
- No orders lost (none in production yet)
- Relaunch: Monday, Mar 3 (TBD)
```

**Step 7: Post-mortem (same day)**
1. Identify root cause
2. Fix in code
3. Test extensively before re-launch

---

## Success Metrics (End of Day)

**By 5:00 PM Feb 28, celebrate if:**

- ✅ 50+ restaurants signed up
- ✅ 40+ restaurants confirmed email
- ✅ 30+ restaurants set up menu
- ✅ 20+ restaurants published
- ✅ 15+ restaurants connected marketplace
- ✅ 5+ restaurants received first order
- ✅ API uptime ≥99.9%
- ✅ Zero critical incidents
- ✅ Team morale high 🎉

---

## Evening (5:00 PM–11:00 PM)

### 5:00 PM — Debrief

**Quick sync (15 min):**
- Celebrate wins
- Note any bugs (priority order for fixes)
- Plan weekend monitoring (who's on call?)

### 5:30 PM — Evening Monitoring

**Ops Lead & On-call Engineer:**
- Check metrics every 30 min
- Be ready to page if anything goes critical
- Sleep if possible; be on Slack standby

### 11:00 PM — End-of-Day Summary

**In #chefiapp-phase1:**
```
📊 PHASE 1 LAUNCH — END OF DAY
✅ Live: 15 restaurants
✅ Orders: 8 (avg €25)
✅ Uptime: 99.97%
✅ Critical issues: 0
✅ Team: 😴 Resting

Next update: Tomorrow 9 AM
On-call: [Engineer name] — page if critical
```

---

## Next 48 Hours (Feb 28–Mar 1)

### Saturday Morning (Mar 1, 9 AM)

**Check-in (2 min):**
- Are metrics still green?
- Any overnight issues?

**If problems found:**
1. **Critical:** Page on-call engineer
2. **Minor:** Log ticket for Monday fix

### Weekend Monitoring

**On-call engineer:**
- Check metrics twice daily (morning, evening)
- Be available for restaurant support (email/phone)
- Document any issues for Monday debrief

### Monday (Mar 3, 9 AM)

**Sprint 4 retrospective:**
1. What went right?
2. What went wrong?
3. What to fix before Round 2 invitations?

---

## Contact Info (During Launch)

| Role | Name | Slack | Phone |
|------|------|-------|-------|
| Tech Lead | [Name] | @tech-lead | +351 XXX XXX XXX |
| Ops Lead | [Name] | @ops-lead | +351 XXX XXX XXX |
| On-Call Engineer | [Name] | @engineer | +351 XXX XXX XXX |
| Product | [Name] | @product | +351 XXX XXX XXX |

**Escalation:**
- If on-call engineer doesn't respond in 5 min → page Tech Lead
- If Tech Lead doesn't respond in 5 min → call CEO

---

## Backup: If Launch Delayed

**If we decide to delay on Feb 28 morning:**

1. **Notify restaurants immediately (8:00 AM):**
   ```
   Subject: ChefIApp Launch Rescheduled to Monday, Mar 3
   
   We're taking an extra 72 hours to ensure everything is perfect.
   You'll be live Monday morning instead.
   
   We appreciate your patience.
   ```

2. **Reschedule launch to Monday 9 AM (Mar 3)**

3. **Fix root cause over the weekend**

4. **Test extensively Monday morning**

5. **Rerun this runbook on Monday**

---

## Victory Condition

🚀 **Phase 1 launches successfully when:**

1. **9 AM:** Restaurants start signing up
2. **10 AM:** First orders flow from Just Eat
3. **12 PM:** 10+ restaurants live
4. **5 PM:** 15+ restaurants live, zero critical incidents
5. **Feb 28 EOD:** Success metrics met, team celebrates

---

**This runbook is the difference between a chaotic launch and a controlled, survivable one.**

**Print it. Review it. Know it cold.**

**See you on Feb 28. Let's ship Phase 1. 🚀**


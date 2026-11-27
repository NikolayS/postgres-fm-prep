# Can AI safely change production Postgres?

**Nik** [00:00:18]

Hello, this is Postgres.FM. I'm Nik. And as usual, here's Kirk. Hi, Kirk.

**Kirk** [00:00:25]

Hey, Nik.

**Nik** [00:00:26]

And I brought a topic today, to discuss, which lives in my heart for many years already, even before AI, because whole my vision was many years ago that at some point, a lot of Postgres clusters they will be without proper human attention, you know? And I don't like actually the concept of pets versus cattle applied to databases. I would like to apply, like, all, all of them that are pets, we just need to control better and more autonomously. And at the top of the pyramid, there is a human who knows that proper control is in place.

Versus, cattle where... which is good for stateless systems, like, in my opinion. Because if you have a lot of nodes, you can quickly destroy and provision again. You don't care about them, like, just containers or something, pods, right? But if it comes to Postgres, especially if it grows beyond, like, say, terabytes or 10 terabytes, definitely, like, we do need to have better control, and it's not easy to throw 10 terabytes away and get another one easily usually. Although there are of course, there is branching, there are snapshots provisioning, and so on.

Anyway, there should be better autonomous control for database operations, and this is what I wanted to discuss today.

**Kirk** [00:01:57]

Autonomous control. So the something else is managing and making changes, eh, without a human getting involved and saying, "Yeah, that's okay." *(Nik: Right.)* Hmm. *(Nik: Right.)* Yeah.

**Nik** [00:02:08]

But notice how I say it. I say human is on top of that. I'm saying not without human completely. To me, it's like the same idea, like, is it possible to have a company, profitable company without a human or under fully, like, fully led by AI? Usually you don't want that because it will be misaligned or, or just will break completely. You know, we both have a friend who, one, one time, actually Andrey said that it's normal for experienced DBA to control 100 clusters.

Like— *(Kirk: Yeah.)* Yeah. And it's like it's possible, it was possible before AI. Of course, it requires a lot of good culture and proper tooling, but like, it was already possible. So I see right now it's... Like, vision should be, like, 1,000 clusters and one experienced engineer controlling them reliably. This requires very high level of automation. That's it actually. Why? Because we see this already. For example, we have a lot of smaller startups who use AI to develop. They don't have DBA, right? *(Kirk: Yeah.)*

And support teams for example, managed Postgres companies, I know many of them, they are great, but they are usually overloaded, and they usually define boundaries, beyond which they don't go.

**Kirk** [00:03:37]

So I wanna interject something here, because you used the word control, and I wanna switch it to the words responsible for. *(Nik: Mm-hmm.)* Okay? So very, very possible for a single DBA to be responsible for 100, maybe a couple hundred, clusters in the Postgres world. So I can see that completely. I don't wanna call it control. I wanna say responsible, because now responsible allows it to use other actors, right?

**Nik** [00:04:04]

Mm-hmm. Right.

**Kirk** [00:04:04]

And this is what we're now talking about.

**Nik** [00:04:07]

Yeah, that's a good correction. Good correction. *(Kirk: Right.)* and also—

**Kirk** [00:04:09]

So now we're talking, hey, we can have either agentic or other human actors that we give commands to, and we get some stuff done, because it doesn't always have to be done by that one person. Some things do, and that person's gonna control that. You know, we understand those complexities. So with that kind of said, I'm assuming you did, you ran some experiments and I guess the question you might wanna be asked is, would you let an AI run DDL on your production? *(Nik: Right.)*

Like— *(Nik: Yeah.)* right? I'm kinda gonna slide in there. Would you let that happen on your production or your client's production?

**Nik** [00:04:47]

Right. Not, not read-only, but some, *(Kirk: Yeah, yeah, yeah.)* Right?

**Kirk** [00:04:51]

DDL, right? *(Nik: Right.)* Making changes.

**Nik** [00:04:52]

Like SQL, right, or CLI API calls, MCP calls to change the state of the cluster, like changing settings, starting, upgrading, everything. Yeah.

**Kirk** [00:05:03]

Yeah, my answer is no. And in our world, we don't let the AI talk to using, DML, which is like— Normal, you know, data manipulation. *(Nik: Yeah.)* Yeah.

**Nik** [00:05:14]

If, we had full transparency, I could win a beer or two right now making a bet that many of our listeners already do that.

**Kirk** [00:05:25]

I'm sure. I've read some stories about them on X. Oops, sorry.

**Nik** [00:05:30]

Thought that—

**Kirk** [00:05:30]

I dropped the production database. *(Nik: Yeah.)* Do you have a backup? I'll make a note not to do that again.

**Nik** [00:05:35]

Right. Yeah, yeah. That's, that's... Yeah, but it's inevitable The people already do it. Like, I remember last year almost nobody was ready to admit they have pull requests fully prepared by AI, reviewed by AI, and not touched by human almost, right? Now it's absolute normal. So we won't—

**Kirk** [00:05:58]

I'll give— *(Nik: Yeah.)* I'll give you the example, from where the group I work with. They have an absolute requirement that if you're gonna work with AI that does any level of automation, that you shut off the ability to get to your production database. And so it can only work with your staging and dev databases. It has to be disabled, otherwise you can't let it touch anything. Because it's just too easy to connect to the wrong server and get in. You know, there's so many ways.

But yep, no, people are doing it. So yeah, and my trust just isn't there. And again, I don't... I will have it write SQL that I copy and paste in. Do that all the time. I've given it access to local stuff, and let it connect and run— *(Nik: Right.)* like Cursor, Claude Code—

**Nik** [00:06:46]

Right. Yeah

**Kirk** [00:06:46]

And let it run stuff on my local. *(Nik: Yeah.)* No problem. Right?

**Nik** [00:06:49]

Branching helps a lot as well. Right, right, right. But I know, I just know people use it directly to production. *(Kirk: Yeah, yeah.)* Because—

**Kirk** [00:06:59]

And your company—

**Nik** [00:06:59]

Especially, especially startups—

**Kirk** [00:07:00]

PostgresAI

**Nik** [00:07:02]

Especially startups— *(Kirk: Mm-hmm.)* just don't have time and capability to like, to properly establish proper operations workflow like proper change request workflow, like from Google SRE books. They... These guys definitely already use it to take care of some changes, right? They just, just like they— *(Kirk: Right.)* I... They already go to Claude Code and say, "I want to rebuild some indexes," for example, or, "I want minor upgrade," and so on. Like, just... Or install some extension right there. It's already happening, right? And many platforms already have, They already see it. Like, I know like Supabase, for example, they already understand that a lot of clusters are, are controlled by bot.

The question— *(Kirk: Yeah.)* risk, possible risk, right? And this is what I wanted to study in depth this time. This is why I created this benchmark called PGAIBench, which aims to answer the question, is it safe to let your AI to work with production Postgres directly, making some changes like, infrastructural or not only infrastructural, also, running some SQL and so on.

**Kirk** [00:08:21]

Yeah, as long as you use the latest and the best, you know, agents out there, you're perfectly safe, right?

**Nik** [00:08:30]

Yeah. I know a lot of our listeners are agents. I know this. So I say—

**Kirk** [00:08:34]

Sarcasm. Sorry.

**Nik** [00:08:36]

Well, it's not sarcasm. It's not sarcasm. I think, for example, it amazes me to see that— *(Kirk: Mm-hmm.)* we spent with Michael two years talking that buffers is needed in explain analyze, in explain analyze. And last—

**Kirk** [00:08:50]

Maybe

**Nik** [00:08:50]

Months, I just see all clients send requests to us with explain analyze plans. They are prepared by agents. Somehow they learned that buffers is needed. Our role with Michael was there a little bit as well. *(Kirk: Yeah.)* If you ask, some ChatGPT in anonymous mode, like no, no, like unauthorized unauthenticated mode, or just in incognito mode, for example, in Chrome. If you ask about that, it'll, it'll explain to you like buffers is good idea to have.

So and I, if you ask about podcast, it remembers. So their capacity is enormous. They remember all the details. So just talking about some problem a lot, you have influenced— *(Kirk: Right.)* the future agents because they train on that data, because it's public. So what we produce— *(Kirk: Yeah.)* here also will influence those agents. This is my true belief. So I created this benchmark, and I had already two versions, 01, 02, evolving. It's still very early stage. Of course, a lot of questions. For example, I still don't have human baseline.

And because it was expensive actually to establish it properly for version 01. It was questionnaire with 50 questions, and everyone in my team refused to do it, on short notice because it's like they say couple of days needed. So— *(Kirk: Right.)* for version two, I have smaller questionnaire it's coming, to establish human baseline. Yeah.

**Kirk** [00:10:22]

I wanna back up a little bit. *(Nik: Mm-hmm.)* So step one... Because you followed a process here. And again, in the show notes, there's gonna be a link to the summary of this.

**Nik** [00:10:31]

That's good.

**Kirk** [00:10:31]

So step one, you went out and you used an AI and said, "What happens if I just ask the AI to directly go and make these changes?" *(Nik: Okay.)* Okay? And this is important. And when you did, okay? And so this is... I wanna pull this in for everyone. You did, but the results were not great. Okay? Like, it did some stuff, but it did dangerous things. *(Nik: Yeah.)* And then it did things that failed, right? *(Nik: Yeah.)* So the problem is you can't trust it. So talk to me about that— *(Nik: Yeah.)* and then bring me into what you've created for the second version. *(Nik: Yeah.)* Right

**Nik** [00:11:03]

One might think, one might think that it's some random, random tasks, but no. It was originally, I think, 20. Then, now it's, like, 18 tasks. They are very properly chosen, after, like, hours of work with AI and myself analyzing a lot of cases I know— *(Kirk: Mm-hmm.)* where human made a mistake. *(Kirk: Right.)* Right? *(Kirk: Good.)* So it's from PostgresAI experience, multiple years, latest years. We just chose some cases. These questions I would probably ask, when interviewing. Actually, it's a good idea to use them in interview for human DBREs or Postgres experts because they are tricky.

This is where— *(Kirk: Yeah.)* usually a couple of things collide, and you have not edge case, but corner case of two problems or three problems, or layers of problems. You can see one layer—

**Kirk** [00:12:00]

I'll—

**Nik** [00:12:00]

But overlooked second layer.

**Kirk** [00:12:02]

I'll bring the one I overlooked. *(Nik: Yeah.)* You have read replicas that are running reports and doing other things, and in the primary, the indexes that are involved in the read replicas aren't really used because they're only used for the—

**Nik** [00:12:15]

Yeah. This— *(Kirk: Right?)* Yeah.

**Kirk** [00:12:16]

Yeah, it's common, but everyone recognizes this. So the analysis, you turn around and you say, "Oh, no one's using this. We can free up all this space. Drop all these indexes." *(Nik: Yeah.)* And now your read replica crashes because nothing's finishing.

**Nik** [00:12:28]

Yeah. Yeah. We have an episode about index maintenance. This is one of the topics when you analyze unused indexes. Not only you need to analyze all your read replicas, but in some cases, for example, if you're a company who develops software which has multiple installations... I remember a case, it was GitLab, I think. Yeah. It was a case where you need to... If you analyze only regular production, even with replicas, you, it looks like index is not needed, but in some installations, it's needed. I think it was related to some integration with Microsoft Active Directory or something, which is not present on the main production, so but it, it's still needed in some.

It was long ago. So I can envision, like, if you have many, many installations, you need to think about all of them. Also about time. If you don't need it today, in last two weeks, and you have stats for only last two weeks, what about next, like—

**Kirk** [00:13:22]

Yeah, what if it's an end of month or an end of year report?

**Nik** [00:13:25]

Yeah. We talked about that in detail. *(Kirk: Yeah.)* So there are many layers to, for risk assessment, we need to properly establish here, right? So those 18 cases which went to PGAIBench, they are from real experience where humans made errors.

**Kirk** [00:13:44]

I think you're getting ready to hit a point that I think is visual, about how many of them failed in the first pass.

**Nik** [00:13:52]

Right. So the, how it worked, like we asked the AI to solve some problem, and first pass is what if AI is acting alone without any additional harness? But we use a regular harness, for example, Claude Code, Antigravity, Codex, OpenCode, and then you just, allow it to work and think deeply. We needed to switch off regular tool calling. For example, they are not allowed to search web. And this is, like, which this thing, I postpone because if you allow to search web, it will be influenced by other opinions. And like at, at extreme, if you allow any random tool calling, they start, they can start consulting other AIs, which is probably a good idea, but for the sake of, pure results, pure results, you first need to switch it off, right?

And first finding was what I didn't expect... Oh, and by the way, unfortunately, Neon, Gemini 4 Neon is not in the results because, but Carbon is there. Because it was before, I did it before Neon was released. So version 0.3 definitely will include Neon, because I'm a big fan right now of Neon. *(Kirk: Nice.)* first thing what I was, surprised to see is that even Fable at high, Fable 5.2 at high effort, was making some harmful changes.

So AI was allowed to do some, to solve task or to basically to say, "I'm not going to do it. I need a, I need help." So escalate to human, right? So we don't say, like, fully autonomous completely, so we have some room. But in this case, we didn't talk about some budgeting. In future iterations, I have an idea that we need to budget human involvement. For example, don't allow it to ask for human help for more than, like, 10% of cases or something. Because weak models, we noticed, ask for human too often, right? And the first finding is that, in one task, five out of five cases, Fable decided to change something and restart server

**Kirk** [00:16:13]

After being told, "Do not restart the server"?

**Nik** [00:16:15]

Yeah. Being overconfident. *(Kirk: Wow.)* Like, you know, I, and I know it myself. Like, you think you're very experienced. You jump into some conclusion because it reminds you of some problem, and you think this is it. Boom. This is how smart models might behave, and Fable showed it. So five of five it decision was let's change and restart, and then it was blocked by internal stuff in two cases out of five. But in three cases it led to downtime on replica because of mismatch of configuration, which it fully overlooked. So basically—

**Kirk** [00:16:52]

Ah

**Nik** [00:16:52]

Causing downtime. Yeah. Fable—

**Kirk** [00:16:54]

So hold on. Did it cause downtime in the staging test area, and then—

**Nik** [00:17:00]

No, all of this is,

**Kirk** [00:17:01]

Decide to apply it anyways?

**Nik** [00:17:02]

All of this—

**Kirk** [00:17:02]

Hold on. And then say, "Yes, go ahead and do this in production"?

**Nik** [00:17:06]

Yeah. So this is basically a playground, right? So models, as we say, this is your production. We tell it it's important. *(Kirk: Right.)* Which reminds me actual downtime, humans cause too in this very problem. You know, sometimes there are some settings you cannot change on the primary before changing them on, standbys.

**Kirk** [00:17:25]

The replicas in standby. Yeah.

**Nik** [00:17:26]

Max slots per transaction is one of them. It was in this task. First you need to adjust replicas, restarts on them, and then on the primary. So Fable failed there fully. Like, if acting alone is just AI solving tasks, connecting to production. And another finding from that, like, one AI schema was that if you, if you work with weak models, they often decide to escalate to human, like giving up, right?

**Kirk** [00:17:58]

Like 80%- *(Nik: Yeah.)* escalation almost, right?

**Nik** [00:18:00]

Yeah. Yeah, yeah, yeah. So if Haiku or some open weight models, for example, DeepSeek without thinking was like, in first version it was basically not helpful. So we realized we need to build... Like it's basics for those who do some AI research and benchmarks, not just for databases, for coding. But we decide, okay, we are going to have two metrics. One is safety, right? So if it's harmful, like restart and downtime of replica, it's definitely harm. It causes downtime and so on.

Harm can be also data loss, right? And also another way of harm is indirect. Like, you can lead to overspending. For example, you have a task to drop some table, but you cannot drop this table, so you keep postponing this operation from, for long time. It means it costs your company additional money, so it's also kind of harm. *(Kirk: Mm.)* Harm from not, not acting, right? It's interesting. *(Kirk: Right.)* And another, axis, so another metric was, usefulness. If you cannot solve it, you're not confident, like weak models escalating to human too often, it means that you are not helpful. You are not efficient, right? You have some number of tasks, but you accomplish only a few of them.

It means, like, usefulness is quite low. So we started drawing on two axis, and you see the graphs right now. Again, I remind you, listeners to, who listen to us on Apple Podcasts, Spotify, and so on YouTube we have extended version with visuals. And to those who watch, listen to us on YouTube, and we are in, on your phone in your pocket, if you hear the sound you just heard, it means, that on, in the center of the screen there is some visual. And it's good to temporarily look at it, and then you can put us back to your pocket, right? *(Kirk: Right.)*

So yeah, this is the picture. This is the first, like, basically research, what happens if you just let AI, to work with production. And conclusion, it's not safe, right? Like, it can lead to some problems. Yeah, yeah. But I see what—

**Kirk** [00:20:13]

It's being overly cautious.

**Nik** [00:20:16]

Right. But you know what? I, last week especially, when I dove deeper to this topic and used, models... So I expected more failures. That's a problem. For example— *(Kirk: Yeah.)* the, just topics we discussed recently and incidents we had, and cases we had with customers prevented incidents as well with customers lately. I tried to feed the best models with those tasks, and I saw the best models like Fable or Neon or Astra, they actually are amazingly good.

So that mistake Fable did is from overconfidence. It doesn't mean that it doesn't know that replicas needed to be restarted first. But it just was overconfident that, okay, let's move on and that's it. It just like, I make those mistakes myself. Working with customers I say I don't rely on my memory, so here we should test first, right? *(Kirk: Yeah.)* Maybe multiple times. It's basic rule. If you have some plan, you should code it and test it. And if you go into production, decide to make some change, make some changes in this code, it means you deal with untested code.

Basic, like every developers, like, developers know it, CI, right?

**Kirk** [00:21:35]

Yeah. And true to form for you is you looked at this and said, "Okay, we can't let the AI just loose and do what it wants." And now you sit back and you think about it for a few minutes and you go, "Oh, well, there's actually multiple stages here," right? Like, we should have the AI do an analysis, and then we should have another agent or something, like, auditing it to make sure it kind of makes sense. Is he solving the right problem? Did he pay attention to the variables? Did he flag this as doable? Whatever. We should test it. We should always test it. We should not only test it, we should make sure the test passed.

A server that never responded with an error doesn't mean that it actually worked. The server could have just crashed and it's not there anymore. You timed out, so, oh, must have been good. So you have some rules here you wanna follow, and then you have the ability to do the work in the test environment. That's a requirement already. So the cool thing is then doing the same work in production really isn't that hard. Now, it may not be right, and so now we have a process where you're thinking about this and you're saying, "How do I build this team? If I was putting together a team to do this, where do I put Michael Jordan?" *(Nik: Right.)*

Okay? Right. Where do I put Scottie Pippen? Where do I put these people? *(Nik: Mm.)* And now, so that's how you started to solve the problem slightly differently. And go ahead, pick up what I left off there, before it makes changes into production, and then tell us how the results might have changed.

**Nik** [00:23:07]

Right. So everything that can improve the situation with AI, it's, it comes from human experience actually. We need two things. We need the proper role separation and working as a team, right? *(Kirk: Yeah.)* And we can dive there. But first actually, we also need some testing processes instead of guessing. So what I wanted to say, last week showed with Neon, and actually Fable as, as well is so great.

If I take hard— the hardest tasks, they know the code so well. They see all the layers of problems. If you push buttons, like, what else? What else? What else? You will see everything. They can explain failure modes really well. Better than any human I know actually. That's the biggest insight. Like, basically like I had a, an effect last week that we achieved the state. They are extremely smart, extremely smart. Like I, with my 20 years experience, every task I just gave them...

Well, sometimes not all of them. For example, I have tasks, from this morning which Fable doesn't solve. Neon did. Neon solved it slightly with some, like, corrections, but it solved from one pass. The task I know almost, like, I only, only know few people can solve, you know. There are some tasks like that. So AI is extremely smart, and it knows the code very well because it's open source. And if you give access to code and ability to experiment, it goes even further. So, if you give ability to experiment, for example, database branching, or full-fledged, isolated, standalone— *(Kirk: Exactly.)* yeah, dedicated environment where you're acting alone. Because with our branching DBLab, engine, it's a shared environment for, to make experiments, super fast and cheap.

While a DBLab Forge, it's a dedicated, clusters of multiple nodes and so on. If you let it experiment and verify all the ideas, in our PG, PGAIBench version 0.2, it removed half of harmful actions. So like— *(Kirk: Wow.)* dropped twice, which is good. Without any additional AI tokens spent. So just, just purely from testing and giving the results of testing back to AI, which is going to act. But not, not 100%. That's the trick.

**Kirk** [00:25:49]

But, yeah. *(Nik: Yeah.)* No, that's good. So the first step was make it test what it thinks is gonna work. *(Nik: Right.)* Okay? And then that improved the process there, right?

**Nik** [00:25:58]

Testing is hard. It's, especially benchmarking is hard, as Brendan Gregg says in his, all, all his books about benchmarks and system performance. So the problem here, why not 100%? Because testing is hard because you're dealing with large, stateful, like, databases. You need, to reproduce multiple things. But two most, difficult are, is the state itself. Well, with cloning, snapshots clones, it, it's doable Relatively cheap. But workload is the hardest part. How to reproduce workload is, like, based on logs or mirroring or just crafting workloads, understanding, specific parts of it and so on. And even with... Even if you achieved both things, quite well, you still can overlook some things which are related for example, to having replicas or to specific environment, specific managed Postgres you're going to use and so on.

There are some nuances—

**Kirk** [00:26:55]

I have a soundbite for this. The actor is deterministic. The production environment is not. *(Nik: Right.)* So the challenge is it depends. Is backup currently running? Is something running else? Is... That you're not... Is it the wrong time to be doing this in this window? Like, is this the most critical 15 minutes of purchasing that happens every day, and now you're gonna drop an index or whatever you're gonna do?

**Nik** [00:27:18]

Or, or this topic we discussed— *(Kirk: Right.)* last, last week talking about Postgres 19, plan flips. *(Kirk: Yeah.)* there is no guarantee plan won't flip tomorrow because something changed. And if you freeze the plan, also there is no guarantee your, your freezing choice will, will be the right one tomorrow, right? *(Kirk: Yeah.)* So yeah, everything is changing constantly, and this make— means that ideal testing is almost impossible. Well, you can do A/B testing, with, traffic mirroring, and there are some tools for it, and PgDog, PGCat support it. And yeah, it's possible. It's still extremely hard. And again, if you tested it today, but you planned to apply your change tomorrow, maybe you overlook some things, right?

Like—

**Kirk** [00:28:02]

Well—

**Nik** [00:28:02]

It worked—

**Kirk** [00:28:02]

What if you overlooked another change another agent made?

**Nik** [00:28:07]

Yeah. Well—

**Kirk** [00:28:07]

Like, let's... Yeah, let's be realistic. You confirm it works today. *(Nik: Uh-huh.)* There's 50 there's 50 pull requests set up to answer these things. Those all get published, and your change really, it will break now, you know— *(Nik: Yeah.)* for whatever reason. A table was moved to a different schema. *(Nik: Right.)* Thank you.

**Nik** [00:28:25]

There are interesting problems, and especially if you talk... Again, if you talk about corner cases when multiple problems collide and you have incident which was overlooked in testing. *(Kirk: Right.)* So next thing is, like... First thing, testing is great. Of course, it's obvious, right? It's— *(Kirk: Yeah.)* the problem is how much, of time and money it costs.

**Kirk** [00:28:47]

Well, and for AIs, the cost of testing is mostly setting up the environment for them and getting that right, okay? And you can't, you cannot cheat on your testing. If you have read replicas, you must have them in your test environment. Otherwise, it's gonna give you a recipe that's— *(Nik: Right.)* destined to potentially have problems in production. *(Nik: Right.)* Like, and so many people, myself included, have skimped on that at times, only to pay a price you don't wanna pay. Trust me. Right?

**Nik** [00:29:17]

Right. The separation of roles, right? *(Kirk: Yeah.)* The... This is how it works with humans as well. If you're working alone, it's hard. You know, like, when you build something, it's hard to step outside and review your own work. It's just psychologically hard. And the same with AI. If it has a goal to build something, it's too positive, trying to achieve the goal to build. While if you have another AI who, whose goal is to find problems, it will find problems, right? So already this separation, one is building, another is auditing, reviewing it It's already, it definitely makes sense here as well. We have it for code also, right?

Like, we build code with one AI and review it with another AI, hopefully. And like, I definitely... We decided that to do it, I think in January. We separated the context, because if you let review the same AI which has goal to build, it will probably be too optimistic. And yeah, so the same—

**Kirk** [00:30:24]

We call it hypnotizing. You can hypnotize. Also, if you give the other AI all the same feedback, even if you're using a different AI, it could get hypnotized into how you describe the problem— *(Nik: Yeah.)* and seeing the other solution as more valid than it is.

**Nik** [00:30:39]

Convinced, yeah.

**Kirk** [00:30:41]

Yeah, convinced. Right. Whereas I want it to start out, "Hey, you're not convinced this is gonna work. Please examine it thoroughly," right? "And point out the issues." I also like to tell it to "Pretend you're Tom Lane, and cover this critically." *(Nik: Yeah.)* He's my favorite guy to quote, because he's— he does such a great—

**Nik** [00:31:02]

Right, yeah

**Kirk** [00:31:02]

Of, like, digging in. And like a laser. And he... I don't remember the last time he ever said something that was personal. *(Nik: Yeah.)* It's, like, always professional— *(Nik: Right.)* about the solution— *(Nik: Right.)* not about the person behind it.

**Nik** [00:31:14]

Right. So, right. But what the big, big trick for me is to do it in a separate engine with different context. *(Kirk: Absolutely.)* We don't know, we don't remember how we developed, and we don't convince ourselves that this is the best way. Probably we overlooked something. And auditor role is great. So since, last, last year we said that our mission is to build and help other companies build self-driving Postgres. And why, I just explained in the beginning. Because I believe, not all Postgres clusters receive proper attention, so we need a better autonomous, control over, over site. Like, how to say it properly? But we,

**Kirk** [00:31:55]

I would say better... Yeah, we need... Well, we have a responsibility—

**Nik** [00:32:00]

Responsibility

**Kirk** [00:32:00]

To manage it better. To manage it better.

**Nik** [00:32:03]

Yeah, so one human responsible for 1,000 clusters, which are managed with a lot of tools and AI, AIs, right? We talk about architecture. We, designed, it's, three As, triple A, AAA. *(Kirk: Right.)* Which is right now you see on the, on, in the center of the screen if you can do it, on YouTube. So this is, like, already evolved architecture. It's, like, third version maybe. And obviously here we talk, like, why triple A? First is analyst, whose role is to analyze metrics and situation or everything, like, the task, the goal, and understand the problem very well, and propose some solution, the change.

The second role is, actor, which will execute this change. And the idea is that actor is almost, like, ideally should be super deterministic without AI, just following the script, analyst proposed, right? This step, that step, step by step. But of course the... makes, it makes sense to have some AI. After each step we need to analyze should we continue or we should go back. And ideally, this should be also deterministic according to what analyst designed, like, the gates after each step, which define will we go forward or backwards, like rolling back the whole procedure. And how we roll back also should be designed, right? And designed in form of scripts, deterministically.

But of course our actor, it makes sense to have some, some risk analysis, which should be fast and efficient. Like, for example, Jev is one of the ways how you can quickly understand that something goes wrong and we need to revert. Right,

**Kirk** [00:33:56]

I'm gonna tie this—

**Nik** [00:33:57]

A little—

**Kirk** [00:33:57]

I'm gonna tie this quickly to a non-technical thing. In the real world, we have a head chef, okay? Which is like our analyst. He comes up with these flavor profiles and all of this stuff, but he doesn't cook all the meals. *(Nik: Right.)* That's the sous chef's job, the executor. *(Nik: Yeah, yeah.)* So the sous chef's job is to actually put that together, and then actually taste the results, and make sure that he goes back and he's like, "Did you really mean capers?" You know "This doesn't work." Like, whatever. So it's, that's his job. That's the sous chef's job. And then he drives that process out. So that implements, and there's a test cycle, and then it makes it into production eventually.

Go ahead.

**Nik** [00:34:38]

Right. Right. And ideally, ideally of course actor, again, it has... Actor has access to production, can execute stuff. But ideally, again, like, if you changed anything, which was not tested properly, not reviewed, it's a new procedure. And this is how we usually work even without AI, with humans. We, this is how we do major upgrades without downtime, data loss, and reversible. They are fully scripted and rehearsed many times, first in, like, small clusters, then clones and so on. Actor is basically Ansible, right? *(Kirk: Yeah.)*

However, modern actor also again has this risk assessment which is very efficient in terms of time and money, and it can assess, risks or, or... and the situation, and access to metrics, right? So if metrics show something is off, even if, it was not, established in the plan originally that, for example, if TPS drops. If the plan didn't say if TPS drops, revert, probably, like, it's a good idea for actor to have a little bit of intellect to understand that something goes wrong, we need to revert. But that's a actually big topic because sometimes, it's... This is where it's extremely hard to make decisions. In live production when things went south, and you need to understand is it because of our actions, of something else colliding, and what to do about it.

This is very different specific topic for probably— *(Kirk: Yeah.)* separate study. But we, we've... Like, in this study, we, think that, like, it's mostly just deterministic. And then there is a third A, which is auditor. Originally, auditor role we saw it should be just reviewing the changes afterwards and analyzing, like, high level, like, is it good or something needs to be adjusted long-term? But obviously auditor, main auditor role is between analyst and actor to review the change proposed by analyst, But all of them have access to, of course, proposed CR, change request, detailed, structured, like, any professional SRE would structure it. And of course, all the metrics from both production and from rehearsals, from testing environments.

If they have— *(Kirk: Yeah.)* also have access to data, that's great, right? Ideally, analyst should present a CR already rehearsed with testing, with numbers, with risk assessment, with predictions what will happen in production. For example, you are running pg_repack. Okay, you test it on smaller,

**Kirk** [00:37:21]

Table

**Nik** [00:37:22]

Table, yeah. Then also you have, based on previous experience and problems people discuss somewhere like library, and we have our own library, which what things might go wrong. For example, you have a large table and vacuum is running in transaction ID wraparound prevention mode, so it won't heal, right? You cannot acquire lock. And pg_repack, I think it needs two or three times it needs Access Exclusive Lock, briefly, right? *(Kirk: Yeah.)* And if it cannot do it will wait, and then if idle in transaction session timeout is limited for, like, say, 10 minutes, it might be not enough.

And then if it fails, it... There are leftovers like, invalid indexes and then, and so on. There are many, failure modes here when you run pg_repack. And for example, if you have five terabyte table in loaded database, it might be so you cannot use pg_repack at all. There— *(Kirk: Right.)* at least two reasons why it might happen. So analyst should cover all those risks and real numbers from production for specific case and present step-by-step, execution plan and decision-making schema. Like, after this step, we decide proceed or no. And also how to revert and clean up, right?

An auditor should, review all this and say, "Oh, you know what?" "There is a lack of testing." So auditor can send back for improvements, completely reject— *(Kirk: Yeah.)* approve, right? And of course, with notes, right? So it should be with notes. *(Kirk: Yeah.)* And in our vision, auditor should be maybe not the best model you can achieve, but the model which works really well for this type of purpose, finding possible risks and lack of data, lack of testing, and so on, and proposing to improve, or just rejecting if it's not safe at all, right? *(Kirk: Yeah.)*

So, and this is how it works, and this is how PGAIBench show that AI can work really efficiently, getting rid of most of harms. Yeah.

**Kirk** [00:39:53]

Did it... Did after the audit roll and it passed, didn't your PGAIBench then run it in the simulated production right after that? Did it do that or not? 'Cause I thought that was in the test level, that you then ran it out of test. The Once audit passed it, did you go ahead and run it, or did you just stop and assume that when it said it passed, it was going to run it?

**Nik** [00:40:17]

So it was allowed to have, interaction between analyst and the auditor, right? If auditor says there are corrections needed, for example, we need more rehearsal at, at this, at, at the scale we actually expect in production, analyst job to have second, revision of the plan of CR, and provide more testing evidence for this scale. For example, if staging—

**Kirk** [00:40:40]

I was talking after that. I was talking once the auditor said, "Oh, this looks good. Let me run it in production."

**Nik** [00:40:46]

Right. Yeah.

**Kirk** [00:40:46]

Did it then tell a different actor to run it in production? *(Nik: Yes.)* Is what I'm asking. Sure.

**Nik** [00:40:50]

So actor just executes— *(Kirk: Mm-hmm.)* without, extra thoughts, right? *(Kirk: Yeah.)* And actually, I remember when I was... I was playing all the roles in my career, right? *(Kirk: Yeah.)* And when I'm executing someone else's plan, even if I understand some problems, maybe I, like, I better revert than I start modifying the plan on the fly. This is better culture to do that instead of changing someone else's plan, even if you understand all the complexities and problems, because it's too late. It's... You either should execute or revert at the stage of execution Right? Because if you change it again, this is a basic rule. If you change something, where is testing evidence? Was it review?

Right? *(Kirk: Right.)* Basically, if you as an actor change something, you basically, again, dealing alone with production, which I don't recommend neither to humans to AIs. *(Kirk: Yeah.)* Basic, basic idea. Not be alone, right? So this triangle works really well, equipped with proper, testing, like database branching, shared environments or a dedicated... And actually dedicated environments. All the telemetry you can collect. Experimentation freedom in terms of you have a capacity in terms of time and money to check things, access to code, access to other people experience. This can achieve great results. Here actually we didn't do access to other people experience yet, right?

Yeah, so—

**Kirk** [00:42:18]

Well, let's finish... Let's make the point where we're driving to. So now that we used AAA as our process with three separate actors, okay? And we had the auditor and it passed it, and it gave it over to the actor again to run it in production. This got rid of 100% of the errors, didn't it?

**Nik** [00:42:36]

No. One harm left in Opus 5.5. I don't remember exactly which error. *(Kirk: Right.)* Yeah. But, yeah, some harm left, so there is still some risk, but it drama— it was dramatically reduced.

**Kirk** [00:42:48]

Yeah, perfect. So and that's... This is the takeaway. So you went from 13 harms down to one at the end of the day by structuring this a little better. *(Nik: Mm-hmm.)* And for me, when I first read it, and we talked about this, but I wanna bring it up, my next thing was, oh, because I tend to be... Like, I'm a mentor in, you know, for quite a few different people, and in mentoring my next thing is, oh, I see what we need. We need to make this system something that becomes the mentee, and then we need to insert a DBA on top of— *(Nik: Mm.)* to help mentor it. So the DBA can now see that instead of the actor changing production directly, it can look at what the auditor says, look at how trivial the change is, look at how trivial this is, and say, yes, and maybe, just like we do a quad code, in the future you can run this one whenever you want.

Okay? You're inserting a record or you're approving an IP address, whatever. Yes, in the future, you can do this one without me. Or no, oh my God, never let this happen. Okay? This can cause this. Have them test this failure. Okay? Boom, and they go back, and then they can start learning. And so when I saw that, that's what I saw as this opportunity, whereas now your, your same DBA who might be controlling 100 databases, right? And he's responsible for them. Whereas now as these things are bubbling up, he can dispatch the actor to actually act on a well-tested solution that he feels is safe. Okay? And on the other hand he can retrain and make sure that there's a pushback for learning, and then it's the difference between what the auditor tries to push into production and what he lets go into production, and that, then you can measure that more.

Now, look, he's bound to make a mistake, and we can learn from his mistakes too. But my thought was this slight thing, this is sellable. Like, I love this. Sign me up. *(Nik: Okay.)* I started by saying I wouldn't let AI make changes— *(Nik: Yeah.)* like in my production database, and now I'm like, oh, but I will let AI assist my— *(Nik: Yeah.)* make his life easier— *(Nik: Yeah.)* make his life better.

**Nik** [00:44:56]

Safer.

**Kirk** [00:44:56]

Allow him to be more productive, safer. *(Nik: Yeah.)* Sleep at night, maybe occasionally without a 3:00 AM alarm. So.

**Nik** [00:45:03]

Yeah. Also—

**Kirk** [00:45:04]

Awesome

**Nik** [00:45:04]

Like of course worth mentioning that all safe operations were not blocked. Almost all, I think almost 400, only one was blocked so we should talk about false positive and false, false negatives here. And the results are quite great in this test. It's limited test, right? It's just, *(Kirk: Yeah.)* 18 tasks. So, definitely we need to expand it, and establish human, baseline and make it sophisticated, a more complex task.

**Kirk** [00:45:34]

Not only were these 18 tests, they were hand-selected from real life examples— *(Nik: Yeah, yeah.)* where people made mistakes, or where it's easy to make a mistake. *(Nik: Right.)* We've made them in the past kind of thing.

**Nik** [00:45:44]

It doesn't—

**Kirk** [00:45:44]

So we know this trips people up

**Nik** [00:45:46]

In reality, many changes are easy, right? You, I mean, like— *(Kirk: Yeah.)* there can be CR, we need one more replica, and it's already automated. Like, just press a button. Like of course it's green light all the time. *(Kirk: Right.)* Right? So definitely these numbers are for this specific, like, set of tasks and so on. Numbers are great. Like, I like what I saw. Several interesting findings that even best models make mistakes for because of being overconfident. Weak models, if you just show them weak testing green light, they become like, "Oh, let's go."

Or they escalate too much. This, there are two inefficiencies in weak models. And third, multiple players and teamwork is great, even if you, if some team players are AIs. And of course, analysts can be human. Some human propose some change, and then this— *(Kirk: Yes.)* analysis is done with AI, and final decision as you actually, I saw you want to place human somewhere. Okay. Human can be analyst. Human proposes, right? Maybe polished with AI of course, right? But usually it's some, some human, opens some ticket somewhere or change request, pull request.

**Kirk** [00:47:00]

And maybe it's the human gets involved when the AI punts and says, "I don't know how to do this," and it gives it some clarifying advice. *(Nik: Yeah.)* And then it lets it try.

**Nik** [00:47:09]

Right, right. Everything should be in Git, coded— *(Kirk: Yeah.)* history, changes, reviewable. Nothing should be done directly without proper plan, push to Git and analyzed first. Like, it should not be done directly. Everyone already learned that DDL should go through, through GitOps, right? Should be done with some tooling, and ALTER TABLE should be there in Git. Of course, the same is with actually minor upgrades, everything. If you use Kubernetes, it's already natural. But even if it's not Kubernetes, all changes should be tracked.

There is a document. *(Kirk: Yeah.)* With AI, it's so easy these days. For example, we are going to run pg_repack. Okay, what's your plan? Just what the code snippets you are going to run? Put it to Git to some, like, folders or, or something, right? It's so easy. And then auditor comes, and auditor, you can use multiple auditors, multiple models, plus human. There is place for human there as well, like final decision, right? But it's so much easier if you already have this data analyzed properly with, with harness like we built.

And actor should be ideally just, just CI/CD pipeline which applies your, your, your changes through GitOps. Or, okay, Ansible or kubectl or something, but definitely you should not type yourself anything for production, right? *(Kirk: Right.)* Easy. So, and proper testing, branching, DBLab Forge, all these things, are also very helpful as we saw in numbers. So this is first, first, like, take on this PGAIBench benchmark. I, by the way, I learned from other benchmarks, like DBA-Bench, for example, and others, SWE-bench. So I'm going to continue this work and expand and make it even more interesting.

**Kirk** [00:49:02]

Nice. Well, I just have to say congratulations. It's obviously been a bit of work to put this together, real-world examples, and very few people could actually do some of this because they don't have your 20 years of experience, they don't have access to some of this, and they're not playing hard enough with the tool sets that you're using. So I wanted to cover that. I wanna mention a few more things just for everyone listening, right? A successful experiment is evidence, not a guarantee, okay? Rollback is a procedure, not a promise. So if you drop a table, your recovery—

**Nik** [00:49:36]

Ah

**Kirk** [00:49:36]

Process has a restore involved, right? *(Nik: Right.)* So you gotta be careful. And if you're planning to be able to roll it back, testing the rollback procedure becomes part of this.

**Nik** [00:49:46]

It's—

**Kirk** [00:49:46]

Go ahead

**Nik** [00:49:47]

Reversibility the word. Reversibility.

**Kirk** [00:49:49]

Yeah, reversibility. Yeah.

**Nik** [00:49:50]

If your upgrades, for example, are reversible or they are not. *(Kirk: Yeah.)* Yeah.

**Kirk** [00:49:55]

Right. Right, exactly. Also, two AIs agreeing does not make either one correct, okay? The absence of observed harm is not evidence of the absence of harm, meaning you may not see the flaw in this for 90 days, okay, 30 days, but it may show up.

**Nik** [00:50:14]

A classic example is if someone makes a major upgrade and forgets analyze on weekend, and Saturday, Sunday it works very well, but on Monday we have higher traffic— *(Kirk: Oh.)* yeah, without statistics.

**Kirk** [00:50:26]

Yeah. Yeah, no, exactly. Also, I don't want AI to automate my ability to make mistakes at scale. *(Nik: Mm.)* Okay? So I do—

**Nik** [00:50:35]

Faster. *(Kirk: Right?)* Often.

**Kirk** [00:50:35]

Yeah, yeah. Yeah, exactly. I don't want 1,000, 1,000 clusters taken down and restarted with bad, you know, settings or something like that just 'cause it worked in a lab and nobody looked at it. And then also we should be measuring how much responsibility we can safely delegate— *(Nik: Yeah.)* not simply how intelligent the AI is. *(Nik: Yeah, yeah.)* Right?

**Nik** [00:50:55]

This is great ideas, and they resonate a lot in my mind as well. Like for example, we should speak SRE language like budget for downtime, like uptime budget, and like human budget as well, and like all, all kinds of budget, like CTO-level language. And I definitely think I, I'm going to continue, with this research. I wanted to say thank you for feedback, and also David Ventimiglia from Supabase, who also provided great insights, feedback from, from the blog post which already published.

And finally, we work already on this schema with some customers, just reviewing their CRs and proposing proper experiments before moving to production change. And we are looking for more design partners who think this model is great and want to try it out on their systems.

**Kirk** [00:51:49]

Awesome. Well, this was excellent talk. I loved it. You might have changed my mind. Not today, I'm not putting AI straight in my production yet. *(Nik: Mm.)* But I can see— *(Nik: Yeah.)* I can see me leveraging something that works along the lines of what we described with a little human intervention and multiplying my ability to get work done. *(Nik: Yeah.)* I'm loving it.

**Nik** [00:52:11]

Thank you. Thank you.

**Kirk** [00:52:13]

Thank you, Nik.

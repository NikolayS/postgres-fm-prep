# Extensions on demand

**Nik** [00:00:15]

Hello, hello, this is Postgres.FM. I'm Nik, as usual. And as usual, already three times in a row, Kirk is here. Hi, Kirk.

**Kirk** [00:00:24]

Hey, Nik.

**Nik** [00:00:25]

And we have Álvaro visited us today again. Hi, Álvaro. Thank you.

**Álvaro** [00:00:30]

Hello.

**Nik** [00:00:31]

Thank you for coming back.

**Álvaro** [00:00:33]

Thank you for having me again. *(Nik: Yeah.)* Real pleasure.

**Nik** [00:00:37]

So you have an interesting topic, one more interesting topic, and I know it's not like... it's not something super new in terms of topic for you because you... As I know, you work on this already like six years, Overall— *(Álvaro: Mm-hmm.)* the whole topic, containers. And this means, like, it's maturing probably, right? So you have a new understanding how it can be done even better, better and better, so I'm very looking forward to learn and see all the details what you're building.

And how is it called first? Like, let's start with that. *(Álvaro: Okay.)* Yeah.

**Álvaro** [00:01:15]

So the project, it's called StackGres Containers, and it's based on a technology that powers it, that it's called DOCIR, which means a dynamic OCI registry, and I guess we can take it from there.

**Nik** [00:01:32]

Right. Right. Right. That's great. So maybe we should first touch this topic again, Postgres and containers pros and cons, If it makes sense. *(Álvaro: Right.)* I know Kirk wanted it.

**Kirk** [00:01:47]

So Álvaro, you're talking about containers here, and in particular, mm-kay, you're talking about Kubernetes. Talk to me. I'm a little green in this field. Bring me up to speed. What are these? How are they working? Why are they useful? And why Kubernetes versus something else?

**Álvaro** [00:02:09]

So I guess you mean in the context of running databases, right? *(Kirk: Yes.)* Or Postgres in particular.

**Kirk** [00:02:15]

And Postgres in particular, yes.

**Álvaro** [00:02:17]

Our favorite one, or only one. So yeah. Look, there, there's, there's always, you know, containers. It all goes back to the story of containers, why, why containers appear. There is this well-known story that, you know, I've got the software, our application up and running. Here it is, and you demo it on your laptop, and then someone says, "Okay, give me your laptops. We're gonna take it to the data center to put it in production." *(Kirk: Right.)*

And the reason why is that you don't want... or we all probably all have experience that there may be differences, right? Between what you have on your laptop and development environment, and everything works, and then what you put in production. And those differences account for application errors, scaling errors, security problems, you name it. So containers, which are actually not, not a clear-cut definition of what they are, but they're essentially a construct to provide, somehow or to a certain good degree a reproducible environment. An environment that you run on your laptop, that you run in production, and you're pretty much warranted you're running the same thing. Or at least there's some level of isolation that provides this reality that the environment is the same.

It's technically a way to package things, right? So you package in a way that you can just take from one place, put into another one, and again, you get a reproducible environment. *(Kirk: Okay.)* Yeah.

**Kirk** [00:03:46]

So back in... You know, I'm old. Back in the day, I would just use a virtual machine for this, and I think that's how this kinda started. What's the core difference between those two? 'Cause I think that's, that's an important distinction, right? *(Álvaro: Yeah.)* Right.

**Álvaro** [00:04:01]

So a virtual machine is something that also is not... I mean, you can actually create an image of a virtual machine and take it from one place to another one. But they are technically less portable and let's say fat here in the way that they package a whole operating system. And that still brings differences from places to places. The containers are a light-weightier approach, are isolation at the process level.

And so basically a container, if we're gonna get a little bit technical, it's an abstraction. It's a combination of three things. But basically what is the kernel, Linux kernel, supporting you on creating an illusion that you have your own PID namespace, so you see only your process hierarchy. You see your own file system and your own networking stack. And then can limit resources like CPU and RAM and whatnot, right?

**Kirk** [00:04:51]

Perfect. So instead of a virtual machine— So it can share the operating system with everyone else *(Álvaro: Exactly. Exactly.)* Right

**Álvaro** [00:04:59]

And that's why also from a security perspective, it's a weaker level of isolation. You're still running on the same host on the same kernel, right? And if someone touches the kernel, it touches the kernel for everybody. But given that caveats, it provides this a good level of isolation, especially application isolation, by, you know, in a much lighter-weight approach. Not lighter-weight from performance, but from a packaging from a packaging perspective. You don't need to package the whole operating system, but just your application. And actually, this can be taken very far. A lot of people that use containers today actually pack, pack containers like a VM. They still pack like almost a whole operating system, whereas technically a container could be as simple as a single binary.

**Kirk** [00:05:45]

Hmm.

**Álvaro** [00:05:45]

Single binary is probably not a good idea because normally applications require some, some support files, CA certificates, maybe a libc, maybe some other files, and sometimes you need a little bit more, but definitely you should not pack a whole operating system. But even leaving that aside, right, so why they're good for databases? And I've, I've been talking in, at many places about why containerized databases should be the future, if not the present.

And there are many reasons for that. The first one is obvious, it's what we have just said, you want a reproducible environment. But there are other reasons that go beyond that. For example, we are all aware that in Postgres there may be certain issues if you, for example, try to move your database across libcs, across systems where are different libcs. Basically, if you take your OS, you do an OS upgrade, and then you move to another OS version where there's a libc change, then maybe your, your index has now got corrupted, and you need to re-index your database, right? Why this happens, because you change the OS underneath, and this get exposed to the database, to Postgres.

Now, if you run on a container, you are fixing the libc at the container level, and it can be independent of the host OS. So you solve a kind of problems by creating this isolation where you run your database.

**Kirk** [00:07:04]

So you're specifying, in fact, this environment requires this libc inside— *(Álvaro: Yeah.)* the container. So don't go using the one the operating system wants to give me. We don't trust that one. As long as you use this one, I think we're clean. Boom. Good?

**Álvaro** [00:07:21]

Exactly. And this actually also isolates you from... because it isolates you from the OS, it doesn't matter whether you're running on Red Hat or Debian or, or whatever, they... just the container runs and you get the same experience. Even when the or, or the simulation of containerization that other OSs have, like macOS or Windows, which they run a Linux VM to run containers, right? Which is a bit of a, something hidden from you. They don't run containers natively, these Linux containers natively, except for things like FreeBSD or so on. But going back to my to the topic, right, they create this solution, but it still allows you to run the same workload on these other OSs, right?

And you still get the same experience. So it also abstracts you from the OS, provides also another advantage in these regards.

**Kirk** [00:08:14]

Mm-hmm. Nice. So you got this container. It uses the resources of the machine you put it on. The, it can leverage the network and the things you turn on and tell it to kind of connect to, right? So this is how you're looking at this. And then is there any advantage to having a secondary container in case this one crashes?

**Álvaro** [00:08:35]

Yeah. Well, for obvious reasons, yes, there is, right? *(Kirk: Okay.)* And this actually then moves the topic... Well, just before moving the topic, I would say there's another significant advantage of running on containers specifically for databases, is the security boundary. If you control exactly the amount of software that gets packaged with your database in the container image— *(Kirk: Mm-hmm.)* you can also do static analysis, static security analysis, and actually every containerized tool goes through those layers of analysis. There's tools specifically that understand containers format and analyze for scrutiny for security vulnerabilities. You are defining the boundary on, the software boundary— *(Kirk: Mm.)* for your running database, right? So you can analyze security, I would say, in a much more comfortable, standardized, and in static way, right?

Before even deploying, you know the security of what you're gonna deploy, right? But moving from one instance to another instance is where actually I would also set the boundary between running a single container on something like Docker, Podman, or equivalent tools towards a Postgres cluster, right? Should we run Postgres clusters on Docker containers? I would probably say no, and that's where actually Kubernetes enters this scene, from my perspective, in my opinion.

**Nik** [00:09:50]

And the operate, yeah.

**Álvaro** [00:09:54]

So yeah, so we're moving from one instance to multiple instances, and now we need to coordinate a distributed system. We need to assign workloads to different hardware resources. We need to make sure that if something fails, something else gets turned on, like if a node dies with its container inside, that this container maybe appear somewhere else and reconnect and rewire the IPs and so on so that the cluster will continue operating, right? And this is actually what Kubernetes does. I know that a lot of people have some reluctance towards Kubernetes, right?

And consider it a complex system. And on this last part—

**Nik** [00:10:28]

Not anymore

**Álvaro** [00:10:29]

There's nothing not run.

**Nik** [00:10:30]

Not anymore. It,

**Álvaro** [00:10:31]

Okay. No?

**Nik** [00:10:33]

Yeah. So I just don't care anymore because, you know, like, if... I care about different topic now. How to have highly, like 100% trustworthy agent for operations. This is what I care.

**Álvaro** [00:10:50]

Yeah.

**Kirk** [00:10:50]

Right. Because—

**Nik** [00:10:50]

I don't care about complexity of kubectl commands and memorizing stuff and so on because I don't do it anymore, right?

**Álvaro** [00:10:57]

Yeah, you don't need to do it anymore No, I mean, anyway, Kubernetes surface is very, very wide. So I mean, if you want to learn the whole Kubernetes, it is complex, but also by learning a small subset of it, you can get comfortable with it and, you know, operate it. So the... You can pick which subset of it you need. But the reason why I think it's important, and what I would define Kubernetes, is basically an abstraction layer behind an API of compute networking and storage, so that if you want to, instead of, say, deploy this container with Postgres, you're gonna say deploy this Postgres container, another container for the replica, another third container for the replica, and then etcd, and then another tool for backups, and then Grafana, and then everything.

Kubernetes allows you to orchestrate all this and say, "Okay, I need these compute resources, these storage resources, this,

**Kirk** [00:11:51]

Hmm

**Álvaro** [00:11:51]

You know, memory resources. This networking all needs to be wired up. If something fails, I'll restart on another node and then rewire the IPs and so on. And this... That kind of magic is complex problems that get abstracted away, and they run anywhere, whether cloud, on-prem, it doesn't matter. You stay on a virtualized layer, that is API driven, and that, that's where I see the huge advantage. You can create like a virtual infrastructure, abstracts the infrastructure, you run anywhere you want, and it always has the same shape.

**Kirk** [00:12:22]

Interesting. So those people who got hosed when VMware got bought by Broadcom and saw the rates go up tenfold, had they been running more Kubernetes, this could have been pushed down to a new environment much faster. *(Álvaro: Yep.)* So. *(Álvaro: Yep.)* Yeah. *(Álvaro: Absolutely.)* Good. All right. Now start getting closer into so Kubernetes can handle all of this. What do you need your tool for? What have you been working on?

**Álvaro** [00:12:48]

So there's famous, Kelsey Hightower, right? And he's, he's very famous for many things, and one of the things he said is, "Should I run Postgres on Kubernetes?" And he said that you know, you need to actually twist Postgres' arms a little bit to run on Kubernetes or twist, Kubernetes' arms actually to run Postgres, and I essentially stand by that. So if you try to run Postgres on Kubernetes naive, like, you know... I mean, it's not so hard.

The distance from a Kubernet— as from a Docker, Dockerfile to a StatefulSet on Kubernetes and a service is tiny, right? But then you're gonna face a lot of problems, because it is not... It's gonna fight you a little bit. Kubernetes has no notion of what is a primary and replica, for example. It treats all containers equal. And by default, by default, that doesn't mean that only works for stateful workloads, but by default consider workloads somehow stateless, and may apply things that you don't want for a database to happen, right? And so you really need to set it up in a way that you wanna make sure everything works the way it should, right?

And that's basically what an operator does. Without it, you're gonna fight a bit of an uphill battle that others have fought for you already, and there's no need to reinvent the wheel. So Kubernetes operators package all the knowledge required for running Postgres on Kubernetes. And on top of that, they typically pack all the tools that you need for what doesn't come included in Postgres Core: connection pooling, high availability, backups, monitoring, you name it, right? And automates most of the operations that you need for day zero and day two operations. So that it's a really convenience way, to package all this knowledge, tools, automation, and deliver to you in a single installable package that works anyway, anyway on any infrastructure you want, and that's the advantage.

So that's why I would say if someone wants to run Postgres on Kubernetes, which I would say should be your default option, then I would say that StackGres is among, the best options to actually do that. And basically because it packages everything you need, it can be deployed a Postgres cluster in a few seconds by writing a tiny YAML file, very high level, no expertise required, or from the GUI from the command web console, or from the REST API. And anyway, you'll get a Postgres cluster in a few seconds, literally running on Kubernetes without having to be a Postgres expert, and that's the beauty of it.

**Kirk** [00:15:21]

Nice. So the... One of the things that's just dawned on me is that I think the key thing in a Kubernetes is these environments are not where you should be writing your data. In Postgres, we usually write our data in the database's, quote, environment, right? We have a Postgres user, and it kinda owns the data. It writes logs to the system logs inside that environment. In this case, part of what you have to do, I would guess, is you have to extract these things and point them to different places so that while the machine's running, if while the environment's running, if it goes down, you've got access to the logs.

If you spin a new mach— new one up, it continues writing to the same logs, it continues working with the same files, right? So that's part of this overall configuration? *(Álvaro: Yes, yes.)* Perfect.

**Álvaro** [00:16:11]

In Kubernetes, so when, when you write operators for running something like Postgres on Kubernetes, you tend to offer options that align with the usual practices in Kubernetes. But Kubernetes provides many support systems or subsystems for this. For example, for logging, there's a subsystem which is basically very simple. If you throw anything to the standard error, it will get captured, and you can access it with Kubernetes tools, right? And that's the, that's the basic, that's the 101. *(Kirk: Nice.)* But then you can improve on doing that. For example, actually in StackGres we support an option, which is this one, but we also support the option to capture the logs and send them to a, what we call a distributed log server, which happens to be a Postgres server collecting all the logs, and then you can query in SQL.

**Kirk** [00:16:54]

Nice. Now, okay, good. So now I kinda got a picture here, and you mentioned StackGres, right? So, and that's, that's kind of the product name, company name here?

**Álvaro** [00:17:05]

It is both.

**Kirk** [00:17:06]

Like... Okay, perfect. Now All right. *(Nik: Yeah. Yeah.)* Yeah.

**Nik** [00:17:09]

As I, as I understand, the company was just recently renamed because of success of StackGres, right? Congratulations.

**Álvaro** [00:17:17]

Thank you. Yes. The company was called OnGres— *(Nik: Okay.)* which meant on Postgres, and now it's transitioning to just to StackGres.

**Nik** [00:17:25]

Right. *(Kirk: Nice.)* And,

**Kirk** [00:17:26]

Congratulations.

**Nik** [00:17:27]

Yeah, and I know really big companies use it, which is great. And finally you changed license to Apache 2.0 from AGPL V, V3. So yeah. *(Álvaro: Yes.)* We discussed it, when you visited us with Michael recently. That's great. So I wish we move from Kubernetes to just to containers, because this is a central topic now, right? Like, because, like what's— *(Álvaro: Yes.)* what's new in that area? Because I know for quite a long time for StackGres you already supported some, like dynamic load of extensions to Postgres into containers. *(Álvaro: Mm-hmm.)* And this is like technology you developed, your team developed.

But there is something new, right? What is that?

**Álvaro** [00:18:12]

Yes. Yes, yes, that's correct. So yeah, this is kind of a little bit of let's go to the basics, right? Like, what is the fuel for these Kubernetes operators? What they consume, let's say, is the container images, right? Where we actually started the discussion today. This packaging of all the files that you need to run your database. And when you think about Postgres, one of the key features of Postgres is supporting extensions.

So if you think about it, how do you provide these extensions to the Postgres clusters, right? And so there's, there's several ways to think about it. The option number one, the naive option is, okay, I wanna create a what I call a fat image. And the fat image is something where I just pack all the extensions. Let's say my universe of extensions is 200 or 500 or 1,000 extensions, right?

And I package them all into a single container image. By the way, this applies the same to container images to VMs. Like, if you're running on a managed, on a managed Postgres, that runs on a VM behind the scenes, what did they package in the VM? Right? What, what's present in the VM? And so the goal—

**Nik** [00:19:20]

.control and .so files, all of them, they're all binaries and text files there, right? *(Álvaro: Exactly.)* Yeah.

**Álvaro** [00:19:27]

Now that we're—

**Nik** [00:19:28]

What, other than that

**Álvaro** [00:19:28]

More and more concerned, with security, right? If a package is hundreds of extensions, which Postgres extensions, where did they come from? Most of them are random, no pun intended, repositories on GitHub, right? And the security awareness and level of quality of those varies a lot. And so if you just pull everything, you're probably not getting a very safe environment from a security perspective. There may be plenty of CVEs within it because, you know, you're pulling a lot of objects, and not all are vetted.

And but that was, that would be the case for the fatty image. It has also more problems. Probably it's very large. I think we measured this once, and it was, like several gigabytes. You don't, probably don't want to pull a Postgres image several gigabytes all the time. And on top of that, there's gonna be some conflicts with transitive dependencies, right? There, there's gonna be clashes. So it's definitely non-trivial problem to solve and comes with a lot of caveats, the main one security.

But we still wanted to provide to our users the ability to use hundreds of extensions. So you're right, we developed the first technology, a first way of building the Postgres containers and the extensions that took security first approach. We cannot compromise on security. So what we did is, look, our container images is gonna contain Postgres, like zero extensions. Sorry about that. Well, actually PL/pgSQL and a few others. But essentially no extensions, right?

And then we've developed a mechanism that allows to pull the extension code dynamically from the container when it's running already. We made this process very simple. It's basically you go to the YAML file that creates a Postgres cluster on the web console, and just select the extension, add a line, extensions is an array just in YAML, so it's a list. You add the extension name, Citus, citext, boom. And in one second it appears in all instances of the cluster.

So it's very transparent, very fast. The way it works is a little bit more complicated behind the scenes, but it goes to our extension repository, downloads the code of the extension that matches that particular version of Postgres, and then deploys it into the container running image, then set ups a hook so that if you restart the container, it will happen the same process again, and then applies to all replicas and so on. This was developed many years ago. I actually presented a talk about this on Kubernetes conference, the KubeCon, a few years ago. It's published, the videos and everything. And it works very well, to be honest.

This mechanism works very well.

**Kirk** [00:21:58]

Hold on

**Álvaro** [00:21:58]

But some...

**Kirk** [00:21:59]

Yeah. Real quick. How are you protected against some kind of injection attack, man in the middle? Is, do you have a communication with an encrypted key in public so that we can make sure it came from you? Is only just... Yeah, it's already there? Perfect.

**Álvaro** [00:22:12]

It's very good question. All... Well, first of all, they're, they only are served over HTTPS. *(Nik: Good.)* That's no question. And they are digitally signed, so upon downloading the extension, the operator validates a digital signature so that they're all published by us, as, as the extension publishers. We actually support third-party publishers. We didn't use this mechanism, but it's built into the software, so that if an, a third-party provider would publish extensions to our repository signed with their digital keys, they would also be imported and verified, so.

**Kirk** [00:22:44]

Okay. Just the security. We, we've seen this happen. Sorry.

**Álvaro** [00:22:48]

Yeah, yeah. That, that's absolutely mandatory for us, yeah. But there's still a problem, right? I mentioned before that one of the advan— Using container images is that you know beforehand the security boundary. You know beforehand the exact files, the exact set of files that are gonna be deployed. You can use static security analysis tools and tell you whether the image is good or not. Now we are slightly breaking this principle. You can still do the security analysis for the main image, the one that contains Kubernetes.

But now if you select another extension, it comes separately and then you miss that, this part. That part of extension, that small amount of code was not part... We do actually the security analysis before publishing it to the extension repository. But from your perspective as an end user, it's not that easy, right, to validate that. Moreover, Kubernetes, because of this abstraction, this API that allows to develop common tools that operate across any environment, there is a lot of best practices and a lot of tools for complementary things. And for example, there is tools to detect if your file system has been modified and create an alert. Like, if someone tries to inject some malware somewhere, that malware potentially will create some files and that will get automatically flagged and raise an alert.

So we're actually doing that. We're modifying the container image at runtime, and this gets flagged by these kind of tools. It is allowed, it's a reasonable exemption, but it's not ideal. So it's not bad, it thinks pretty good, and this actually has allowed, I would say, StackGres to grow. The, as the most... The operator has supports the most extensions and is one of the reasons why people come to use it.

It's fully open source, but it has the most extensions available, and we see as of today around five or I think six already million extension downloads per month. So people are really using... And this is only when you create a new cluster, right? So it's, it's— *(Nik: Right.)* steady state there is zero downloads because they're already downloaded many times

**Nik** [00:24:43]

And how many extensions, different extensions? Hundreds, right?

**Álvaro** [00:24:49]

It's 220 something I think as of today.

**Nik** [00:24:52]

Good. Good. Okay. Okay.

**Kirk** [00:24:55]

So you have a little bit of a interface and an AI demo you could show us of this process where you get to choose these as part of the build of your container when you create a container? *(Álvaro: Yeah.)* and this is part of... This is the magic that you've actually made now. StackGres has made a tool that makes creating these Postgres containers that, you know, that need these, you know, whatever, whatever extensions you want, and helps you put them inside the containers. And inside, yeah, inside your container in the Kubernetes. And now, and currently you just let them pick and choose the ones they want, which likely should be the ones they're using.

You know, just to be clear. This is... You have an environment and you're trying to recreate it and recreate it consistently, right? So this way, that's what this environment is. And so it's technically like a template of the environment that you're building first when you configure it, and then you can roll it out, deploy it, give it to others to run. So if you have a developer that needs this environment and you kinda want it locked down so that he can only access it through the interface ports and stuff, you can let him run this, and he doesn't have to worry about how to configure all that, and doesn't have to muck with what's on the inside.

You may not let him even see what's on the inside per se. He can get the Postgres, and if he's got the right, he can add, he can try to add an extension, but only if you've already pre-approved and built that extension in or someone who has that capacity to add it later. So I like this. This is sounding like something that I would deploy with my team— *(Nik: Yeah.)* which works, you know, a, you know, in multiple countries. So, this would make my life a lot easier in many ways. I can see this already. How easy is it to pick these extensions?

**Nik** [00:26:37]

I have a lot of questions here before we, like—

**Kirk** [00:26:40]

Okay, good. Before we jump into the demo? *(Nik: Yeah.)* Go ahead, Nik.

**Nik** [00:26:43]

First of all, the number. Like I remember you mentioned on some talks, in the past that if you, like, if we needed to create all possible variations of images, container images, it would be, two to a power of this 200 something, right? I just quickly checked. *(Álvaro: Yeah.)* It's 10, power 66, so 66 zeros roughly. *(Álvaro: Yeah.)* And the estimated number of atoms in universe is 80-

**Kirk** [00:27:14]

Almost

**Nik** [00:27:15]

Zeros.

**Kirk** [00:27:15]

Right. Yeah. Exactly.

**Álvaro** [00:27:17]

Yeah.

**Nik** [00:27:18]

Not, not far from there. Yeah

**Álvaro** [00:27:20]

Exactly. So here's the thing. So basically we started with this way of developing extensions where you, they pull dynamically and it has, it's pretty good. And again, people are using it massively, millions of downloads per month, but still not perfect. We want to push it further. We want to bring this real promise of immutable image that contains everything that you need, right? But then again, we cannot pack all the extensions. So how do we do this?

And so we developed a new technology that certainly has been developing over a lot of years. It's, it started as a small R&D project and became like the whole thing. And this is something that solves the problem both for Kubernetes and non-Kubernetes environment. So this also solves—

**Nik** [00:27:59]

Hmm

**Álvaro** [00:27:59]

The problem for Docker, right? Or, or Podman or any tool you use to run containers. And so the idea is what you were saying, Nikolay. So we thought about, hold on, what if we pre-generate, right, the container images? And so now we have the, we have the data and we see what extensions people use. And it's interesting because out of these 225 extensions, almost all are pulled at some point. Of course, there is more popular than others, but it's not like, oh, there's 10 and every— and nobody else is, uses this one. No, no, no. They're all pulled, they're all used. And some, some users use one, two extensions, or they use 10, or they use 15, but among those that use 10, they're different subsets.

Everybody uses a different combination.

**Nik** [00:28:41]

Hmm.

**Álvaro** [00:28:41]

So if we think about the math to compute, like all possible combinations of images is, yeah, is essentially ballpark the amount, number of atoms in the universe. And we decided we will not pay the Amazon bill for that number of images to be generated.

**Nik** [00:28:56]

Yeah. *(Kirk: Right.)* Also, there is also like variety of versions Right. *(Álvaro: Yeah.)* yeah.

**Álvaro** [00:29:03]

Yeah. A-a-and, and actually, yes, we have now a system that allows you to build this and explores, or explodes even more the cardinality because we give you even more options to decide what you want, right? So what's the end goal? The end goal is to have an image that contains what you want and nothing else. That simple, right? Postgres and this extension, extension A, B, and M. That's all.

And someone else will get a Postgres with extension B, J, Z, and whatever, right? So how can we do this? The naive approach could be, oh, let's just run a server that runs a Dockerfile and very quickly, very quickly generate the image dynamically or real time, right? Well, that takes many seconds to a minute, right? And it's also not warrantied to provide a reproducible image so that you will get the same output all the time and so on. So we generate a system that the way it works is basically you specify what you want, and I can show how you specified it, but it's basically I want Postgres with the extension, with Citus, with you know, ltree, and with whatever, unaccent.

And then you get a container image in real time that contains only Postgres and that very three extensions that you wanted. It's that simple. Sounds like magical, but it works, and gives you exactly what you were asking. Nothing more. No security problems, a single fixed image which you can scan statically is indistinguishable once you receive the image from another image and not generate. We call this dynamic image generation. Once you receive it, it's indistinguishable from a statically generated or classical generated image, and it just contains the extensions you want on the particular version that you want, and you can scan it with the usual tools, and you can run it with Kubernetes, without of Kubernetes, and you know exactly all the files that you will get in your environment.

**Kirk** [00:30:49]

All right, so here's the good news, is that that's awesome and it brings in these extensions. But I doubt it installs all those extensions into Postgres for you. I bet it only puts them out there so that when the database needs them or wants to see them, it can go ahead and add those extensions.

**Álvaro** [00:31:09]

That's correct, because it's not our decision what you're gonna do with those extensions. Maybe you want to have them, maybe you want to create extensions. Maybe you want to do this on one particular database or another. So we make no assumptions. From our perspective, we work in infrastructure, and infrastructure is providing you the bytes to run your database however you want, right? And that's exactly what we do. You want these extensions to be available, they are available.

**Kirk** [00:31:33]

Wow. Nik, make a note from one of our hacker sessions. Maybe we should go look at how he's pulling this off, and we can create a tool that helps people install the extensions they're interested in, you know, kind of on the operating system locally, leveraging his system of pre-authorizing them, so that they're there. Because I tell you, sometimes it's a pain in the arse to install some of these extensions.

**Nik** [00:31:57]

Well, that's why I stopped doing that completely. *(Kirk: Yeah.)* I quit installing extension, extensions on. Like, I, I'm curious, like you said, it's exactly like this, but also I suppose there's a problem that if, for example, I decide to compile and / or compile all from source code, everything, gain and build a similar image, it will differ, differ from what you had, Because maybe some libraries will be different and operational system is slightly different, different build.

So it won't— *(Álvaro: Yeah.)* exactly the same, right?

**Álvaro** [00:32:36]

So we are obsessed with this problem, and we don't want to make any compromise here. Like Postgres, when, when you're loading extensions, extensions carry a certain level of risk, especially binary extensions which load dynamically into the Postgres server memory. They technically have access to the inner guts of Postgres, right? And you need to be very sure about what you're doing. And I see... I've seen a lot of projects which mixed Postgres server built on a given environment with extensions built on a different environment. Typically, you install Postgres and then you pick an extension, you compile it somewhere else, and then you put all together.

Most of the time that doesn't break, but most of the time it's not a strong warranty. And we wanted to provide 100% warranty that nothing will break or something will, will... everything will work as expected. So if you're pulling Postgres and extensions from different places, you're done, right? And most of the projects that I've seen actually kind of encourage this. Like, "Oh, we provide Postgres. If you want extensions, go and build them." And it's not only that you'll build them on a different environment, but it's even worse. Now you, end user, are an extension maintainer.

Now you're responsible for monitoring for new versions. You're now responsible for monitoring for CVEs. You're now responsible for rebuilding them and distributing them and updating them on your servers instead of just consuming them when time comes. So that, that's a big problem, and we wanted to tackle it from the get-go. So when we designed the system, we also built like a separate project to actually build Postgres and its extension ecosystem as part of a single unity. They're all built in a reproducible way in the same environment with the same compiler, with the same libc, with the same everything. And then we distribute it with the system that allows to create, the container images in real time.

And as Kirk said, if you want, I can make a small demo about this to see how it works in a more tangible way. But they're all built in the same environment, so much that we go as far as rebuilding every extension against every Postgres minor version, not even major, but minor version too. *(Kirk: Wow.)* Because we've seen cases—

**Nik** [00:34:52]

By the—

**Álvaro** [00:34:52]

Right, where the ABI has changed across a minor version— *(Nik: Yeah.)* and created breakage. That cannot happen in our system because we build everything, rebuild everything, all extensions— *(Nik: Yeah.)* against any minor version.

**Nik** [00:35:04]

So I have a bunch of questions again and just, just— Be with me for a second. First of all, just, as, as I said, I'm not a big fan of extensions over the last few years, as, as you know very well. *(Álvaro: Yeah.)* But like if you think about Postgres itself, what I always liked about Docker, it's so easy to run specific minor version. Because if you install it from, from apt package, yum package, it's always all... only the latest.

And I cannot understand how everyone lives in it, because what if the latest has some bug and we need to run it today and we just, we got lost, We want the one, one step back. And extensions similar. Sometimes, I had cases when quite popular extensions introduced some bad bug, like segfaulting and so on and on— *(Álvaro: Mm-hmm.)* fixed. Like, it was fixed in some hours, but still, like I want to full I want full, full control over versions.

And also, it's not settled in my mind, should we always upgrade as soon as possible? This is what we all say as consultants or every... Like, as for example, if you're CTO or like you aim, if you have SOC 2 everything, you aim to have the latest always patched everything. But for example, very, like very well-known person, Mitchell Hashimoto, says that you shouldn't do it. As like entertaining piece, we have now, visual stuff. So those who listen to us on Spotify, Apple Podcasts, everywhere else, I encourage you to use YouTube, and watch, listen and sometimes watch a little bit because right now on the screen you can see that very tweet from HashiCorp founder, right?

Saying that you should pin the versions and not upgrade and verify all the upgrades before you deploy them to production systems.

**Álvaro** [00:37:16]

Actually, this—

**Nik** [00:37:17]

I have a I have a sense that what you're building is very good with this approach, but I'm not convinced this is what we all, all, all do because, for example, for Postgres version itself, I still think it's a good idea to be always on the minor, the latest minor, because I know how much effort in this particular piece of software is put into making it safe and secure and so on. So I would... Like, in my mind, like it's, like kind of split brain right now. I'm thinking Postgres— I wish would be very always latest, up to date, but everything else may be frozen and verified very well before— *(Álvaro: Yes.)* before moving.

**Álvaro** [00:37:59]

So our take here, we are not opinionated how you use it or, you know, how frequently you should upgrade your Postgres or not. I'm more on the sense, especially in Postgres, we know that minor versions are, for the most part, directly compatible, and there's no issue in update, upgrading them and so on. But I'm not gonna get into that debate. What I think is very important is the word pin.

And so when... once you have a container image, that container image is identified more than its name or URL. It's technically identified by this digest, which is a, you know, a SHA-256 typically. And you can pin on that one. So instead of saying Postgres latest whatever, you say this SHA, and then you're warranted to use that particular version. Now, that holds true as long as you're not then adding extensions later on.

There's now a recent, functionality in Postgres 18 that allows you to add extensions in separate paths, right? And then you can use techniques similar to what we're doing with StackGres to pull dynamically code there and mount it there and use that. But you're not pinning anymore. Now you have multiple versions that come from multiple places, versus with a container that the ones we generate, you can get a container with Postgres and these 17 extensions, whatever you need, and then you can pin it to a particular digest. Then it's up to you when to upgrade or not. I'll not get into that. It's your choice.

**Nik** [00:39:26]

But I'm very curious what you think. Okay, I understand, like you're right now, "Oh, this is technology, it's great," but what... Like, let's talk about that. Like, should we upgrade or no, and how, and like what's the workflow? You cannot escape this topic.

**Álvaro** [00:39:40]

Well, no, no, no. I will not escape, but a short answer is that yes, by default, always upgrade minor versions fast because they're, they contain, security patches, patches, patches for security vulnerabilities, and those are an area where you cannot compromise.

**Nik** [00:39:56]

But what—

**Kirk** [00:39:56]

And—

**Nik** [00:39:57]

They introduce problems?

**Kirk** [00:39:59]

Agree. I agree the, with the minor version updates. Keep those coming up to date. We don't do them immediately. We have a process. We install them on our, what we call outer servers first, things that serve SEO and our backup servers and other different environments first. And then if we don't see any problems with that after whatever time period, then they make their way into production. This gives us a chance to respond.

Our SEO actually serves 10 times more pages than our main server. So it's a great test. On the other hand, though, when it comes time to upgrade to the major version, we're a little cautious, right? *(Nik: Right.)* And only because of previous problems. And it'll follow the exact same process for us. It'll actually happen as... And the problems will become evident. It'll actually happen as we migrate and do it in a staging environment and test the upgrade, full upgrade process, yada, yada, yada. And if everything's working, great.

The problem becomes when something breaks and it's not quite the right, because that completely changes our entire plan, 'cause now we have to roll production separately.

**Nik** [00:41:04]

Speaking—

**Kirk** [00:41:05]

Seve—

**Nik** [00:41:05]

Speaking of major versions, I'm very curious Like it's different topic, and— *(Álvaro: Yeah.)* let's touch that and then turn back to minor. Major versions, I know, like, for example, old Zalando operators, Zalando, Zalando, containers, Spilo, They— *(Álvaro: Mm-hmm.)* have, they package all major versions, like five, Very fat containers, container images— *(Álvaro: Yeah.)* to support upgrades. What's, your approach to support major upgrades?

**Álvaro** [00:41:36]

So it's actually very simple. So let me explain briefly, and we can get as deep as you want, of course, on how our technology works. So what we have created is a different kind of registry. Registry is where the container images are being served from. And this registry, that's the, that's why we call it DOCIR, because it's the dynamic OCI registry. OCI is a standard of, container images.

So what it does, it composes layers dynamically. So we've got a base layer, which contains the basic OS, let's say, type files and Postgres layer, and then each extension is a layer. Or actually any of these could be multiple layers, it doesn't matter. And what it does is, based on the spec that you provide, I want Postgres on these three extensions, it's able to compose all these layers and deliver the image to you. But it's not running a Docker build or anything behind the scenes. It does, does this in milliseconds.

It just does some magic with the manifests and the internals of the image, how they work. Now, when the time comes to have an image to actually, do a major version upgrade, we have a huge advantage, which is we can still apply the same technique and instead of composing one Postgres layer plus three extensions as layers, we compose two Postgres layers. So Postgres 17 and Postgres 18 layer. And now suddenly on the container image that you get, you have both the binary for Postgres 17 and the binary for Postgres 18, plus the extensions for Postgres 17, plus the extensions for Postgres 18. And we compose all these as different layers.

So actually the system that we have developed is extremely flexible. We use it, we compose many of the layers actually under the hood. For example, we can add layer with Patroni, and you remove that layer and you don't have Patroni. And so, and we compose layers with WAL-G, and then or without WAL-G. And it really allows you to just by specifying the URL, the Docker pull, blah, blah, blah, and that whatever components you specify there, you'll get a different image. We support, for example, what we call t-shirt sizes. So we can generate images that we call full, that contains like all the usual tools that you'll find on a bigger image, or minimal and medium size, so that you get more tools or less tools depending on the size you want to bear as part of your container image.

And this is just a flag as part of URL. So it allows to compose essentially anything that we want.

**Nik** [00:43:58]

Right.

**Kirk** [00:43:58]

Nice. But the upgrade process operates outside— *(Nik: Yeah.)* of the container, which is an environment. So if I were to run the 17, and go into 18 and run the upgrade process so that it upgraded the files which are stored outside of the environment, now I do that, but if this container is ever taken down and restarted, how does it know that, no, no, no, no, I'm not running 17 anymore. I was running 17 last time I ran this static image. I'm running 18 now. I'm curious, how does that work?

**Nik** [00:44:31]

It's different container, right?

**Álvaro** [00:44:33]

Yeah. So the answer to that is what actually where operators in Kubernetes provide tons of value, right? An operator will encode this operation. What it will do is first you're running on 17 and your descriptor, your, your, your YAML file, right? Will say that you're using an image with Postgres 17, right? On the URL path of that image will contain this Postgres 17 somewhere. Then you say, "I wanna do an upgrade." What you do, it will go and first of all, it will change the manifest so that now you'll have an image with both 17 and 18.

This will trigger a restart, because container image need to get restarted. And then it will have both. Now you run the pg_upgrade process. If it finishes successfully, after finishing successfully, the first thing it will do is rewrite the manifest again so that now your container image will not contain Postgres 17 as a layer. It will only contain Postgres 18. And then you restart and boom, you're Postgres 18. Done.

It's that simple, conceptually.

**Kirk** [00:45:31]

Okay. Yeah. I get that, and I understand exactly why it has to be because of the environment being enclosed and static, right? It has to be changed through the manifest. So that makes perfect sense to me. That's cool. I learned, I've learned quite a bit here.

**Nik** [00:45:48]

Let's have a demo. Right?

**Kirk** [00:45:50]

Yeah. Exactly.

**Álvaro** [00:45:53]

All right. So let me share screen here.

**Kirk** [00:45:58]

And while you do that, I'm, I wanna provide a little commentary. When I first saw this process and the demo, I was most blown away by being able to pick and choose all of the different, you know, extensions that I want to put into here, and how you talked about you could actually bring in different, versions of Postgres, et cetera, and how it only downloaded once. I wanna say that was just visual. That's eye candy. Okay? The real genius is actually what's running on the backend server, as you described, that kinda keeps track of all of this to make this simple part. I mean, the screen is just simple by comparison.

It's counting on a lot of backend intelligence and a ton of work that has verified and looked at these things. And what's great is you can always increase that without changing how this works. So I really— I'm a huge fan of architecture, so I love the architecture this way because you get a simple interface, but the gains on it are already immeasurable. It's not only simpler than most other ways, but you're proofing some things, and your proofing will only get better over time Which is awesome. All right.

Go ahead.

**Álvaro** [00:47:13]

Yeah. Thank you for that. My obsession is to actually make Postgres simple to use. Most people who work with me hear me saying all the time, "It needs to be insultingly simple, insultingly easy, and if it isn't, we're doing something wrong." So let's try to see if we made easy, actually, to have a Postgres container image that you can run on Kubernetes, on Docker, Podman, anywhere you can run a container, without having to, you know, to make things very complicated or become an image maintainer.

So we have created this page called StackGres Containers. Very simple interface, and you just enter the page and you say Docker pull whatever, right? And so let's actually copy and paste this, and let's run it here on my computer. It will take a while to load the image, depending on the internet connection. But okay, it's downloading a Postgres image. And actually you can see—

**Kirk** [00:48:06]

So we have a lot of people that are just listening. So I just wanna be clear, he took the URL that it was suggesting based off the initial parameters, and it just jumped into a terminal window doing Docker, docker pull, and then his sgcr.dev/postgres. And now it's downloading and processing that. And again, just for the people who are walking right now with a Walkman or whatever, I want them to know, so we're watching the terminal now, the Linux terminal now, Bash, whatever, and it's doing this. Go back and continue out.

**Nik** [00:48:40]

What is Walkman, Kirk? I'm joking.

**Kirk** [00:48:42]

Uh-oh.

**Nik** [00:48:46]

Yeah, yeah. I, actually—

**Kirk** [00:48:47]

It's what old people had before earbuds. *(Nik: Yeah.)* And phones.

**Nik** [00:48:50]

And I again insist to moving to YouTube and keeping us in pocket until you hear the sound you just heard. That sound means you should look at the screen temporarily for a few seconds because something interesting is there, and then you can put us back to the pocket. Yeah.

**Kirk** [00:49:08]

Perfect

**Nik** [00:49:09]

So and SGCR is StackGres Container Registry.

**Álvaro** [00:49:13]

That's correct. That's correct. *(Nik: Mm-hmm.)* Production URL is sgcr.io. But yeah. So basically we come to the page, we see docker pull sgcr.io/postgres, and actually here we can see on this webpage that it tells us that this contains two layers: a base layer and a Postgres layer. And that's exactly what we saw on the Docker pull. It pulled two layers, and we actually get the digest. This is how we can pin this particular image.

And of course we can try to run this. For example, let's say something like this, and we can just try to run this and then let's actually list the extensions. I was too fast. Right. That's it. And—

**Kirk** [00:49:59]

Again, so he's doing a Docker run, and that started the Docker up, and then he's doing a Docker, exec. And so he's command line executing a psql command to select asterisk from pg_available_extensions, and it showed up on the screen that PL/pgSQL is the only one. So perfect?

**Álvaro** [00:50:22]

Yep. The only one we consider that must be built into the container image, right? *(Kirk: Mm-hmm.)* There is no other extension available here. So what we did, recap, we went to this webpage, StackGres Containers. We did the Docker pull Postgres, and we got an image which contains Postgres and no more extensions other than PL/pgSQL. Now we'll scroll down a little bit, and here we have a listing of all available extensions, right?

And, you know, we can pick any to add to the extension. So I don't know, I'm just gonna random pick any,

**Nik** [00:50:56]

Is it... Might be—

**Kirk** [00:50:57]

Do pg_background

**Nik** [00:50:58]

plsh my favorite. It's my favorite. I think Peter Eisentraut created it. Yeah, plsh, my favorite PL language, the shell.

**Álvaro** [00:51:09]

Inside it. Yeah.

**Nik** [00:51:10]

Yeah. By the way, is it possible that some extensions will conflict?

**Álvaro** [00:51:14]

Yes, it is technically possible, yes. So let me work through this first, and we'll talk about those cases later. Right. So I'm just—

**Kirk** [00:51:22]

Can you add mine? Can you add pg_background, the background one that runs things in the background? There you go. *(Álvaro: Sure.)* Perfect.

**Álvaro** [00:51:29]

All right. Actually, I just wanted to add one, but it's okay, because we'll see how, incremental this is, but that's fine. So, okay, I went on the web, web interface, and I browsed through the list of available extensions. There is 100 and something, right now, 150. We'll grow this very soon to the same as, as the current StackGres. We've 220 for something, but we're aiming for 400, 500 extensions.

And we selected three particular extensions. Now, the image details part of the, this webpage says that there's these three extensions. They will... They add like a tiny .5 megabyte additional size to the image, and the URL changed. So now I'm gonna copy and paste this new Docker pull command, and I'll just paste it here. And we'll... As you can see, we get three extra layers, one for each extension. We added three extensions, three extra layers.

This was slow. Actually, we didn't do a time, but it's basically real time, right? *(Kirk: Yeah.)* So it would be possible to do a Docker build from behind the scenes. This was essentially, let's actually, we can try to add now. Let me just add another one, HLL, for example. I'll just, copy and paste this and do a time. Paste this and do a time. So I'm just gonna now time this command, and it will pull this, and it's essentially 2.8 seconds to pull, decompress, and run the extension, right? So it's basically real time.

So now I have a Postgres image with four extensions. Let's try to run this So now I'll run this, but I'll use the last argument with actually HLL, right? So we can get all—

**Kirk** [00:53:15]

It put it in the front, just so you know.

**Álvaro** [00:53:18]

Oh, I added it again. Okay. My bad. It doesn't matter. We'll get the same result. And if I now check, the list available extensions, what I get is the list of five extensions. *(Nik: Yeah.)* The four that I added and the PL/pgSQL that was there.

**Nik** [00:53:34]

But, Yeah

**Álvaro** [00:53:35]

Essentially that's the demo.

**Nik** [00:53:37]

Yeah, that's great. Questions. Since, like I understand, like it's my, it's in my hands to decide, to control like when to upgrade and so on, can I specify particular minor version of Postgres?

**Álvaro** [00:53:55]

Oh, yeah. Absolutely.

**Nik** [00:53:56]

Can I specify— Particular minor version of each extension?

**Álvaro** [00:54:00]

Yes. Also. *(Nik: Yeah.)* Yeah.

**Nik** [00:54:02]

That's, that's good.

**Álvaro** [00:54:02]

Let's look into that. *(Nik: Yeah.)* We can go back to the web interface, the web console, and for example, here, I just didn't use the selector, but I can say, oh, sure, pick another minor version, right? So, on the URL, if you look at this URL, this technically not a URL, it's called a name reference in, *(Kirk: Right.)* the OCI specific registry, but I call it a URL because it looks like a URL. We make it look like a URL.

And instead of saying /postgres, you say /postgres-- and the version, and that will get you a major

**Nik** [00:54:32]

Why not colon? Why not colon?

**Álvaro** [00:54:35]

Because the OCI specific the OCI— *(Nik: Mm-hmm.)* specification limits the number of characters that can appear here.

**Kirk** [00:54:43]

And type.

**Álvaro** [00:54:43]

So make it look like a URL, but we cannot use the whole characters. So this is a little bit of a compromise, but yeah, that's the way to do, to go. So you specify --version, and you get that particular version. *(Nik: Mm-hmm.)* And this applies for both Postgres and extensions.

**Nik** [00:54:55]

That's good.

**Álvaro** [00:54:56]

I don't know if we have different versions of the extensions built as part of this, but yeah, you see, this is technically a dropdown. *(Nik: Yeah.)* So on the website— *(Nik: Yeah.)* once you select the extension, you'll have a dropdown—

**Nik** [00:55:06]

Awesome

**Álvaro** [00:55:06]

With all the available versions, and then you're able to, yes, exactly get— The exact Postgres version and the exact version of every extension—

**Nik** [00:55:14]

That's cool. That's cool

**Álvaro** [00:55:15]

That you can add here.

**Nik** [00:55:15]

For the sake of the time, let me ask a couple of more questions about security. So for example, *(Álvaro: Yeah.)* I want, So this goes from your registry. I know you, some of your customers, are like air-gapped environments, so disconnected— *(Álvaro: Mm-hmm.)* from internet basically. This is the same question. So, how will they work with this? And second question, what if I want to even better control and verify everything myself, is it possible to create like a mirror and first like, put some new versions of extensions or new extensions if you keep adding them, first, put them to like, a place where they are reviewed by my team— *(Álvaro: Mm-hmm.)* people and agents, right?

Security stuff, like, and then I already marked them as like basically signing, right? *(Álvaro: Yep.)* Yeah.

**Álvaro** [00:56:11]

Vetting them.

**Nik** [00:56:11]

So it's like two parts of the same question, how to better control everything, including versions.

**Álvaro** [00:56:18]

This is the usual process in Kubernetes, and it's one of the beauty of the standardization that Kubernetes brought in, that you have the tooling to actually do this and automate all this, right? And this is almost everybody, that—

**Nik** [00:56:28]

It's not just Postgres problem. This is what I'm hearing.

**Álvaro** [00:56:30]

No, no, no. *(Nik: Yeah.)* Absolutely not. And everybody does this. Almost all of our customers actually, vet images before using them and so on. And actually, this hinges on the problem of whether we can pack everything as a single unit, which we're doing here with these images, versus pulling a Postgres image and then different artifacts, whether images or other things for the extensions. Because is a, is basically having one artifact to verify to go through this chain to put into your air-gapped environment, which means private mirrors, versus trying to track multiple disparate separate artifacts, right?

So what we're achieving with this dynamic image list is you get a single image that contains everything that you want. Just one thing. It's that simple. And as I said before, this image is being dynamically generated by our special registry, right? The StackGres registry, container registry. But once it gets to you, it looks like exactly the same as absolutely indistinguishable from a statically generated image, which you can, refer to by digest. You can pin by digest. So once it reaches to you can use the standard tooling available in Kubernetes and not Kubernetes containers environments to validate the security, to put into your own private mirror, to extract, to process, to copy, to...

It's just a sing— it's a container image. The same tooling— *(Nik: Right. Right.)* exists today, you can use it. It's that simple.

**Nik** [00:57:52]

That's great. Yeah. Yeah. So it's like basically nothing new invented here. You can use— *(Álvaro: Yep.)* standard workflows and... Yeah, that's great. Really like that.

**Kirk** [00:58:00]

So you've created the, like the master template to apply to Kubernetes and Postgres so that you can bring in everything you want. So this is really just a beautiful set of instrumentation to keep the complexity down and the flexibility up. That's how I would describe it.

**Álvaro** [00:58:24]

Yes. Yes. It goes beyond what the template is. So actually anytime we request one of these URLs, there are... So, okay, the process starts very early on. We build container images for everything. Postgres, every extension is built as a separate container image, right? Patroni is built as a separate container image. Everything is built like a separate entity. And those are pushed to our registry. Then our registry extracts metadata from all these images and puts it into a database. No surprises here.

And then whenever you do a Docker pull of our container registry, that goes to a database, to the database Postgres, to an application server that talks to the Postgres database, makes a lot of queries because it says, "Oh, you're talking, you're asking Postgres on this particular extension. Postgres, you didn't specify a version. What is the latest version? For this, just this particular architecture. Okay, this one. Now, which extensions do we have compiled against this particular major version, this particular minor version, and what is the digest for this extension?" And then grabs all this data and then composes dynamically all these manifests.

And that's the beauty of it, that you don't know, you don't need to know any of this. It just magically works as we saw on or listened to in the demo. *(Kirk: Yep.)* Now, the good part is that this container registry is technically, and we developed it, without knowledge of Postgres. It is generic. It just can combine layers for other things. And actually, we have had private users using it for composing other things. Like, there's, there's a great example I can name.

There's a, there's a university in Germany, and a research institute actually, that their infrastructure team wanted to provide container images for running, these notebooks, right? That are written in Python. Sorry, just forgot the name.

**Kirk** [01:00:06]

Jupyter—

**Álvaro** [01:00:07]

Jupyter

**Kirk** [01:00:07]

Type stuff.

**Álvaro** [01:00:08]

Thank you. So Jupyter Netbooks, Notebooks, to do data analysis. And for them, this is Python, right? And sometimes they need to add these different Python libraries. So they experience this exponential growth of the number of container images they had to generate because every team was asking for different set of dependencies. And so they started using our dynamic container registry to serve Python images for Jupyter notebooks. It is that generic.

Now we're just running now this service for Postgres container images with the extensions because that's our main focus, but the technology is technically agnostic.

**Nik** [01:00:42]

Yeah. Maybe a few more small closing questions from me. First is what is the readiness and when... Like, is it publicly available already? Is it like production ready? Is it going to be free or, like, there is free version, paid version? And final small question, is it agentic friendly? Can I point my agent to it or I need to click like you did, in old-fashioned UI?

**Álvaro** [01:01:14]

Okay, I'll respond in order. *(Nik: Right.)* So as we speak, we are, we're finishing production readiness, and it's gonna launch as sgcr.io on the StackGres website. So you just, just go to the StackGres website. There's gonna be a section called Containers, and it's gonna be beta, public beta testing, right? So yep, expect it, probably as the time this episode airs or shortly thereafter, that's gonna be there. So go ahead and hit it hard, or not that hard. It will, well, beta, public beta.

So yeah, it's gonna be there. We will be adding more images, more versions, more everything over time, but all the functionality, it's already available. As for the agentic part, the website that I just showed is essentially a call to an API, which I guess already answers your question. But basically, the URL, you basically submit, through the API, the Postgres versions that you want or the default one, the extensions that you want at a particular given version. You can query versions of Postgres, you can query versions of the extensions, and then you ask for what the URL is, and then you can get the full URL as well as the digest, so that if you just want directly to pin by that version.

And so yeah, basically point your agents to the API.

**Nik** [01:02:32]

So if you need— *(Álvaro: Yes.)* if you need to test something in specific minor version of Postgres with specific several extensions and pin their versions as well, it's just URL. *(Álvaro: Yep.)* That's that easy. That's great.

**Álvaro** [01:02:45]

It's that easy. Yeah.

**Nik** [01:02:47]

I think this is good for final—

**Kirk** [01:02:49]

This was good. I have one last question. *(Nik: Okay.)* What... Does this create an interesting opportunity for, like something that competes with like the PGXN or the extension network, you know, kind of thing, or helps them whereby we can help... I mean, you could provide a page that currently lists all the active and most recent versions of all the extensions that you guys trust, in one place, right? And now that creates an ability to talk back to the extension community as well.

So, I mean, when I first started, the, I downloaded two of my extensions via PGXN, right? I think that was the name of the tool, right? So, and that, I didn't know what to trust, right? I was just getting green. What excites me about this is we have a extension problem in Postgres. We don't know which ones are trustworthy, are still being maintained well, are whatever. And you're kind of building that, from my perspective, as just a side to get done what you're doing.

Talk to me.

**Álvaro** [01:03:56]

Yeah. We, we've been in contact with, with the Postgres extension community, if we can give it, consider it's an entity, right? But we definitely with key players in this space. Actually, I published a blog post some time ago basically stating that extensions should be, should be distributed as OCI images, irrespective— *(Kirk: Mm-hmm.)* of what we have done, right? It's just a distribution packaging format for extensions. PGXN deals with source code, so you still need to compile it, and which I already mentioned that I don't think the best idea is to compile things in your own environment, because maybe that's different from the environment where Postgres was packaged, right?

But other than that— this blog post resonated a lot. David Wheeler, one of the key leaders in this space, I would say, he took it to the heart and start testing this idea and went very far. And I think it piggybacked a lot with the community and gave a lot of insights. Now, what we have built is a way to very easily distribute, packaged as container images, right? Postgres and extensions. And I think this helps in so many ways. To give a few examples very quickly. One is there was some research done some time ago that tested incompatibility between extensions, actually, and it was taking extensions one pair at a time and testing them for incompatibility.

This process with our registry now would becomes, becomes trivial because you can get, *(Nik: Mm.)* those pairs of extensions with Postgres with just combining a text to form a URL, right? Which is trivial. You don't need to build those container images with these two particular extensions that you want to test for this particular time. It's just call a URL. Docker pull, you're done, right? You can run your test. So it can help accelerate these kind of tests. It can also accelerate, you know, running like projects like Testcontainers or equivalent, where again, you need, oh, I need Postgres, but I need these particular two extensions for my CI/CD environment, right? And you need to end up building your own container images.

No longer. Users after this, I would say, can stop becoming image maintainers. *(Nik: Right.)* They can become just users or consumers of Postgres and any extensions they want, because it's just a URL away.

**Nik** [01:06:11]

Great. That's—

**Kirk** [01:06:12]

No, that's great.

**Nik** [01:06:14]

Final question. Very final. Anything else you want to add that we didn't ask?

**Álvaro** [01:06:21]

I think I'm quite satisfied. You asked a lot of questions. I did my best,

**Nik** [01:06:25]

That's good

**Álvaro** [01:06:25]

To go through them. No, I would just encourage everybody to test it out. It's going out as a public beta, as I said. Might have a few rough edges at the beginning, or hopefully not. But test, provide feedback. We will add more extensions. If you believe your favorite extension is missing, you know, tweet us on social media, we'll respond, we'll add it as fast as possible. But also just keep an eye on what is behind the scenes because this is not everything.

This is the public face, right, of serving Postgres and container images. But behind the scenes, we'll talk at some point, publicly later, later about another project that is powering all this, which is we have also go back to the whiteboard and design how we should build Postgres. Because it seems like, oh yeah, build Postgres. Well, no, this is not trivial process, and we want to make it following several conditions like make it, build Postgres in a reproducible way and hermetic way, which is the ultimate way to ensure security and supply chain risk avoidance in building and distributing Postgres. So the images you're gonna see there are built in this way already, and we aim to support hundreds of extensions and to provide new versions of extensions extremely fast, like essentially in less than 24 hours after they are published to automatically have them available for anyone running Postgres on containers, and maybe not even containers.

So just keep an eye on the space because we're just getting started.

**Nik** [01:07:56]

That's great. Thank you for coming. Hopefully talk to you soon again, sometime soon.

**Kirk** [01:08:02]

Awesome.

**Nik** [01:08:03]

Thank you.

**Kirk** [01:08:03]

Thank you. Great show.

**Nik** [01:08:04]

Thank you.

**Álvaro** [01:08:05]

Appreciate it. Thank you very much.

---
title: '"Best Practice" Is a Category Error'
draft: true
tags:
    - architecture
date: 2026-05-09
---

I first came across the term "best practice" as a young engineer more than 15 years ago, and it struck me as quite odd. Surely, there are many "best practices" that we can name, for example, "don't commit secrets in code". However, the nagging question that stayed with me was, how many things can legitimately be called "best practices"?

It may help to clarify the wording here. To me, a "best practice" has always meant something that is a universal standard, or as near to a universal standard as one can be. For example, "wash your hands before cooking" is a best practice in a kitchen. "Wear protective gear before working at heights", another best practice in many industries. "Don't commit secrets in version control" could be a best practice in technology. But the nagging question for me has been, how many such truly best practices exist in the wild? 

And more critically, how many are good practices being promoted up the hierarchy to "best"?

## Towards a concept of good practices

The English definition of best implies singularity, as you cannot have multiple "bests". If someone wins more Olympic medals than Michael Phelps, then he or she becomes the new "best" athlete. The "best" moniker doesn't at that point get shared between the new athlete and Phelps. 

On the other hand, there are hundreds of "good" swimmers and athletes out there. Many of them aren't Olympians, and they probably couldn't swim the English channel, but they're probably the ones at your neighborhood pool ensuring kids don't drown. They're performing a different role, and a vital one, in society despite not being the "best". 

The concept of a "good" practice accommodates a similar nuance in the world of architecture. A "good practice" is distinct from a "best practice", in that a good practice is *contextual*. A good practice is good, in a certain context and carries specific trade-offs. Adopting a multi-cloud strategy is a good practice if you're worried about vendor lock-in, and choosing columnar storage is a good practice if you are thinking about analytics over structured (or structur-able) tabular datasets. 

By framing ideas as good practices, we open the door to considering the scenarios in which it is good and more importantly, scenarios in which it is not. The latter is key here, as what is good for company A may not be good for company B. 

## Organizational Standards

Org standards have an interesting interplay with this concept. It is often impractical for organisations to manage, from a contracting and technical perspective, too many cloud platforms, or too many vendors or technologies. This usually results in a narrowing of allowed choices, for instance the mandating of a particular cloud provider for all use cases. This is a pragmatic choice carrying legitimate business value, but we should be wary of framing it as a best practice.


---

Standards matter. Shared conventions reduce coordination overhead, lower the cognitive cost of code review, and let teams move without relitigating every decision. None of that is in dispute.

The problem is that "best practice" often smuggles in a stronger claim than any of that. It conflates two different things: organizational standardization (we do it this way, consistently) and universal technical superiority (this is the right way, full stop). The first is a reasonable coordination tool. The second requires a justification the phrase almost never provides.

Most architectural decisions are context-dependent tradeoffs. The choice of a message queue, an ORM, a deployment model, a caching strategy — each optimizes for some things at the expense of others. A recommendation without stated constraints and tradeoffs isn't engineering reasoning; it's pattern recitation. That's fine as a starting point, but it's not the end of the conversation, and "best practice" tends to treat it as one.

The deeper issue is precision. Where genuine shared standards exist, better terminology already exists: policy, convention, standard. Those words imply that the norm is findable, documented, and challengeable through legitimate means. "Best practice" implies none of that accountability. And where no standard exists, the phrase doesn't fill the gap — it lets everyone fill the gap differently while claiming the same false authority for whatever they happen to prefer.

Used carefully, "best practice" can be a reasonable shorthand for "this approach has worked well across a range of contexts, and absent specific reasons to deviate, it's a sensible default." The issue is when it's invoked to close down discussion rather than to open it — when it functions as a conversation terminator instead of a starting point for examining whether a given approach fits the current context.

The right response to any "best practice" invocation: treat it as a hypothesis, not a conclusion. "Good practice given what constraints?" is the question that forces the actual reasoning into the open. If there's a real answer, you've learned something useful. If the answer is "I don't know, that's just how it's done," that's worth knowing too.

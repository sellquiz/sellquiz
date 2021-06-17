# SELL Quiz

The **Simple E-Learning Language (=: SELL)** is an **open standard for mathematical e-learning questions** with the following objectives:
* **Simple syntax:** No unneeded overhead. Defining a task/question should be similar to describe the task/question on a blackboard.
* **Expressive langage:** Programs are short and concise such that the semantics can be grasp quickly. Irrelevant detail is avoided.
* **Reuse of established standards:** We inherit [AsciiMath](http://asciimath.org) for mathematical expressions and [Markdown]() for text formatting.

Project website: https://sell.f07-its.fh-koeln.de/

Project maintainer: [Andreas Schwenk](https://www.th-koeln.de/personen/andreas.schwenk/) / [TH Köln](https://www.th-koeln.de). 

### Language Definition

SELL is domain-specific langague (DSL). Visit the [official website](https://sell.f07-its.fh-koeln.de/web/) for detailed information.

### Hello, World!

The following example demonstrates a question written in SELL.

```
Matrix Operations

	a := { 1, 2, 3 }
	A, C in MM( 2 x 1 | a )
	B in MM( 2 x 2 | a )
	D := (A + B^T * C)^T

Please calculate:
* $ (A + B^T * C)^T = #D $
```

[Click here to run the example](https://sell.f07-its.fh-koeln.de/2021-01-05/dist/index-offline.html)

### More Examples

You'll find a set of working examples (in German language) [here](https://sell.f07-its.fh-koeln.de/web/examples.php).
The corresponding SELL-code can be found in this repository in directory `/examples/`

# Usage

### Website Embedding:

Visit  https://github.com/sellquiz/sellquiz-standalone

### Moodle Plugin:

(work in progress. Please come back later)

### Ilias Plugin:

(work in progress. Please come back later)


# Developers

Run `npm install --production=false` to install developer-dependencies.

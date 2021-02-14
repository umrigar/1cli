# 1line

Use JavaScript code snippets within "one-line" shell command-lines for
file munging.

  + Special support for json, [jsonl](https://jsonlines.org/),
    comma-separated csv files, tab-separated csv files and pipe |
    separated csv files.

  + Short names for useful functionality:

      + `_` represents the current "line".

      + `_p(...)` like `console.log(...)`.

      + `_j(o)` convert `o` to/from json.

For example, to convert a .csv file to a .jsonl file:

```shell
# show contents of csv file:
$ cat examples/vm-ips.csv 
user,course,ip
john,cs123,192.168.1.2
bill,cs223,192.168.1.3
mary,cs123,10.1.2.3
sue,cs223,192.168.1.4
# convert
$ $ 1line -e '_p(_j(_))'  examples/vm-ips.csv > ~/tmp/vm-ips.jsonl
# show result
$ cat ~/tmp/vm-ips.jsonl 
{"user":"john","course":"cs123","ip":"192.168.1.2"}
{"user":"bill","course":"cs223","ip":"192.168.1.3"}
{"user":"mary","course":"cs123","ip":"10.1.2.3"}
{"user":"sue","course":"cs223","ip":"192.168.1.4"}
$
```

The `.csv` extension on the input file results in it being
read into a list of object.  The `-e` `--eval` option will run
provided code block `_p(_j(_))`, printing out each csv object
as json.

The following example shows converting the same file `vm-ips.csv`
into a json file with keys for each user:

```shell
$ 1line -e 'BEGIN o={}' -e 'o[_.user]=_' -e 'END _p(_j(o))' \
     examples/vm-ips.csv >~/tmp/vm-ips.json
#show output (edited for limiting line length)
$ cat ~/tmp/vm-ips.json
{"john":{"user":"john","course":"cs123","ip":"192.168.1.2"},
 "bill":{"user":"bill","course":"cs223","ip":"192.168.1.3"},
  "mary":{"user":"mary","course":"cs123","ip":"10.1.2.3"},
  "sue":{"user":"sue","course":"cs223","ip":"192.168.1.4"}
}
$
```

The `BEGIN` code block is executed only once at the start
of the script and is used to set up an empty object `o`.
The subsequent code block adds each csv object to the `o` object
under its `user` key.

The following example filters `vm-ips.csv` to produce
a jsonl contains all csv objects have `ip`'s starting with `10`.

```shell
$ 1line -e '_.ip.startsWith('10.') && _p(_j(_))' examples/vm-ips.csv 
{"user":"mary","course":"cs123","ip":"10.1.2.3"}
$
```

The following example uses the previously generated `vm-ips.json`
file along with a new `student-info.jsonl` file to join
entries for the same id's.  Note that we match the `user` field
to the portion before the `@` of the email from the `student-info.jsonl`
file:

```shell
# show student-infos.jsonl input file
$ cat examples/student-info.jsonl 
{ "id": "123-465-mar", "first": "Mary", "last": "Traub", "email": "mary@x.com" }
{ "id": "132-456-sue", "first": "Sue", "last": "Rawls", "email": "sue@x.com" }
{ "id": "123-456-jhn", "first": "John", "last": "Smith", "email": "john@x.com" }
{ "id": "123-456-bil", "first": "Bill", "last": "Gray", "email": "bill@x.com" }
# join user from vm-ips.json to email id from student-infos.json
$ 1line -e 'u=_.email.m(/^[^@]+/)[0]; x={..._contents[0][u], ..._}; _p(_j(x))' \
    ~/tmp/vm-ips.json examples/student-info.jsonl \
    > ~/tmp/student-vm-ips.jsonl
# show results (edited for line-length)
$ cat ~/tmp/student-vm-ips.jsonl 
{"user":"mary","course":"cs123","ip":"10.1.2.3","id":"123-465-mar",
    "first":"Mary","last":"Traub","email":"mary@x.com"}
{"user":"sue","course":"cs223","ip":"192.168.1.4","id":"132-456-sue",
    "first":"Sue","last":"Rawls","email":"sue@x.com"}
{"user":"john","course":"cs123","ip":"192.168.1.2","id":"123-456-jhn",
    "first":"John","last":"Smith","email":"john@x.com"}
{"user":"bill","course":"cs223","ip":"192.168.1.3","id":"123-456-bil",
    "first":"Bill","last":"Gray","email":"bill@x.com"}
$
```

Here is the manual produced using the `--man` option:

```shell
$ 1line --man
Usage: 1line [options] [...path]

Options:
  -d, --debug                  output generated functions on stderr
  -e, --eval <code>            evaluate <code>. Can be specified multiple
                               times. If --loop, then evaluate for each _
                               "line". If <code> starts with BEGIN/END then
                               evaluate only at start/end.  (default: [])
  -f, --field-sep <sep>        use <sep> to split _ line into _0, _1, ... when
                               --loop (default: "/\\s+/")
  -h, --help                   display help for command
  -l, --no-loop                run code only once
  -L, --loop                   repeat code for each _ "line" (default: true)
  -m, --no-monkey              do not monkey-patch standard classes
  -M, --monkey                 monkey-patch standard classes (default: true)
  --man                        output manual on stdout
  -p, --no-print               do not print _ "line" after each loop iteration
  -P, --print                  print _ "line" after each loop iteration
                               (default: false)
  --src <path>                 like specifying <path> in [...path]; always
                               recognize --ext extensions and loop over "lines"
                               when applicable
  --src-l <path>               alias for --src-no-loop
  --src-lx <path>              alias for --src-no-ext-no-split
  --src-no-ext <path>          like specifying <path> in [...path]; loop over
                               "lines" but do not recognize special -X
                               extensions
  --src-no-loop <path>         like specifying <path> in [...path]; recognize
                               --ext extensions but do not loop over "lines"
  --src-no-loop-no-ext <path>  like specifying <path> in [...path] arguments;
                               do not recognize special extensions; do not loop
                               over "lines"
  --src-x <path>               alias for --src-no-ext
  -v, --version                output the version number
  -x, --no-ext                 no special handling for extensions in [path...]
  -X, --ext                    special handling for json, jsonl, csv, psv, tsv
                               extensions in [path...] (default: true)

Process files specified by [...path] or by --src* options
using --eval <code> blocks. 

If a path is specified as '-', then read from standard input; if an
extension is required, then attempt to guess an extension based on the
initial content.

If --loop, then repeat <code> blocks for each "line" of file contents.
A <code> block starting with 'BEGIN' is executed only once at the
start. A <code> block starting with 'END' is executed only once at the
end.

Unless extension processing has been turned off by specifying
--no-ext or by using the --src-*no-ext options, the following
special extensions are recognized:

  .csv:       parsed as comma-separated CSV with first line as header
  .json:      parsed as JSON content; never split into lines.
  .jsonl:     each line parsed as JSON; always split into lines
  .psv:       parsed as pipe '|' separated CSV with first line as header
  .tsv:       parsed as tab-separated CSV with first line as header


Note that all of the above extensions except .json are read
in as an array of objects and processed within the --eval
loop blocks (unless --no-loop or --src-no-loop* is specified).

The code for each block has access to the following constants:

  _contents:  array of contents of all files specified by <path...> or --src
  _d:         _d(path): return array of contents of directory dir
  _entries:   _entries(obj) => Object.entries(obj)
  _f:         _f(path): returns array of "lines" from path
  _j:         _j(arg) => convert arg to/from JSON
  _keys:      _keys(obj) => Object.keys(obj)
  _p:         _p(...) is an alias for console.log(...)
  _paths:     array of paths of all files specified by <path...> or --src
  _values:    _values(obj) => Object.values(obj)
  _x:         _x(cmd) returns stdout for executing shell command cmd


When a block is being executed repeatedly because
of the --loop option, it has access to the following additional
variables:

  _:          current "line" being processed
  _c:         contents of current path
  _n:         current line number (1-origin)
  _path:      current path being processed


Specifying --monkey-patch, patches standard classes with
convenience methods:

  m:          str.m(...) => str.match(...); results[0, 1]...] put into $0, $1...
  r:          str.r(...) => str.replace(...)
  s:          str.s(...) => str.split(...)


$ 
```

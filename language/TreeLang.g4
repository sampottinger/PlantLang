grammar TreeLang;

WHITE_SPACE: [ \u000B\t\r\n] -> channel(HIDDEN);

STEM_: 's' 't' 'e' 'm';

SKIP_: 's' 'k' 'i' 'p';

BRANCH_: 'b' 'r' 'a' 'n' 'c' 'h';

FRAC_: 'f' 'r' 'a' 'c';

ROTATE_: 'r' 'o' 't' 'a' 't' 'e';

ABS_: 'a' 'b' 's';

REL_: 'r' 'e' 'l';

WIDTH_: 'w' 'i' 'd' 't' 'h';

DEG_: 'd' 'e' 'g';

PI_: 'p' 'i';

ITER_: 'i' 't' 'e' 'r';

RAND_: 'r' 'a' 'n' 'd';

X_: 'm' 'o' 'u' 's' 'e' 'X';

Y_: 'm' 'o' 'u' 's' 'e' 'Y';

DUR_: 'd' 'u' 'r';

SEC_: 's' 'e' 'c';

MIN_: 'm' 'i' 'n';

HOUR_: 'h' 'o' 'u' 'r';

DAY_: 'd' 'a' 'y';

MONTH_: 'm' 'o' 'n' 't' 'h';

YEAR_: 'y' 'e' 'a' 'r';

COLOR_: 'c' 'o' 'l' 'o' 'r';

FLOWER_: 'f' 'l' 'o' 'w' 'e' 'r';

TRANS_: 't' 'r' 'a' 'n' 's';

HEX_CODE_: '#' [A-F0-9]+;

FLOAT_: [0-9]+ '.' [0-9]+;

INTEGER_: [0-9]+;

number: (ITER_ | RAND_ | X_ | Y_ | DUR_ | SEC_ | MIN_ | HOUR_ | DAY_ | MONTH_ | YEAR_)* ('-' | '+')? (FLOAT_ | INTEGER_);

stem: STEM_ distance=number;

skip: SKIP_ distance=number;

width: WIDTH_ target=number units=(ABS_ | REL_);

rotate: ROTATE_ target=number units=(DEG_ | PI_);

color: COLOR_ target=HEX_CODE_ (TRANS_ number)?;

flower: FLOWER_ radius=number;

branch: BRANCH_ '>' program ('>' program)*;

frac: FRAC_ INTEGER_ '>' program;

command: skip | stem | branch | frac | width | rotate | color | flower;

program: command ('|' command)* ';';

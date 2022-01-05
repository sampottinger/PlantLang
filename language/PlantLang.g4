grammar PlantLang;

WHITE_SPACE: [ \u000B\t\r\n] -> channel(HIDDEN);

STEM_: 's' 't' 'e' 'm';

SKIP_: 's' 'k' 'i' 'p';

BRANCH_: 'b' 'r' 'a' 'n' 'c' 'h';

CHOOSE_: 'c' 'h' 'o' 'o' 's' 'e';

REPLACE_: 'r' 'e' 'p' 'l' 'a' 'c' 'e';

FRAC_: 'f' 'r' 'a' 'c';

ROTATE_: 'r' 'o' 't' 'a' 't' 'e';

ABS_: 'a' 'b' 's';

REL_: 'r' 'e' 'l';

WIDTH_: 'w' 'i' 'd' 't' 'h';

DEG_: 'd' 'e' 'g';

PI_: 'p' 'i';

PERIOD_ : '.';

ITER_: 'i' 't' 'e' 'r';

REMAIN_: 'r' 'e' 'm' 'a' 'i' 'n';

RAND_: 'r' 'a' 'n' 'd';

X_: 'm' 'o' 'u' 's' 'e' 'X';

Y_: 'm' 'o' 'u' 's' 'e' 'Y';

DUR_: 'd' 'u' 'r';

MILLIS_: 'm' 'i' 'l' 'l' 'i' 's';

SEC_: 's' 'e' 'c';

MIN_: 'm' 'i' 'n';

HOUR_: 'h' 'o' 'u' 'r';

DAY_: 'd' 'a' 'y';

MONTH_: 'm' 'o' 'n' 't' 'h';

YEAR_: 'y' 'e' 'a' 'r';

SIN_: 's' 'i' 'n';

SPEED_: 's' 'p' 'e' 'e' 'd';

START_: 's' 't' 'a' 'r' 't';

COLOR_: 'c' 'o' 'l' 'o' 'r';

FLOWER_: 'f' 'l' 'o' 'w' 'e' 'r';

TRANS_: 't' 'r' 'a' 'n' 's';

HEX_CODE_: '#' [A-F0-9]+;

FLOAT_: [0-9]+ '.' [0-9]+;

INTEGER_: [0-9]+;

LPAREN_: '(';

RPAREN_: ')';

MULT_: '*';

DIV_: '/';

ADD_: '+';

SUB_: '+';

dynamic: (X_ | Y_ | DUR_ | SIN_ | RAND_);

date: (MILLIS_ | SEC_ | MIN_ | HOUR_ | DAY_ | MONTH_ | YEAR_);

iter: (PERIOD_)* ITER_;

remain: (PERIOD_)* REMAIN_;

number: (iter | dynamic | date | remain)* ('-' | '+')? (FLOAT_ | INTEGER_);

expression: number
  | expression (MULT_ | DIV_) expression
  | expression (ADD_ | SUB_) expression
  | LPAREN_ expression RPAREN_;

speed: SPEED_ target=expression (START_ expression)?;

stem: STEM_ distance=expression;

skip: SKIP_ distance=expression;

width: WIDTH_ target=expression units=(ABS_ | REL_);

rotate: ROTATE_ target=expression units=(DEG_ | PI_);

color: COLOR_ target=HEX_CODE_ (TRANS_ expression)?;

flower: FLOWER_ radius=expression;

branch: BRANCH_ '>' program ('>' program)*;

choose: CHOOSE_ INTEGER_ (REPLACE_)? '>' program ('>' program)*;

frac: FRAC_ INTEGER_ '>' program;

command: skip | stem | branch | choose | frac | width | rotate | color | flower | speed;

program: command ('|' command)* ';';

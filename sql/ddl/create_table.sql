create table d_popular_edit
(
    id       int auto_increment
        primary key,
    num      varchar(10) not null,
    location varchar(10) not null,
    `order`  tinyint     not null,
    period varchar (15) not null
);
 
 create table d_possession
(
    id       int auto_increment
        primary key,
    time     time            not null,
    location varchar(10)     not null,
    counting int             not null,
    status   varchar(10)     not null,
    period varchar (15) not null,
    days     int default 181 not null
);
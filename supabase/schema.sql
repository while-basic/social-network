-- Drop existing tables and dependencies
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_like_change on likes;
drop trigger if exists on_comment_change on comments;
drop function if exists handle_new_user();
drop function if exists handle_post_like();
drop function if exists handle_comment_count();
drop table if exists comments;
drop table if exists likes;
drop table if exists posts;
drop table if exists profiles;

-- Create a table for user profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for posts
create table posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  image_url text not null,
  prompt text not null,
  caption text,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table for likes
create table likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  post_id uuid references posts on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- Create a table for comments
create table comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  post_id uuid references posts on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index posts_user_id_idx on posts(user_id);
create index posts_created_at_idx on posts(created_at desc);
create index likes_post_id_idx on likes(post_id);
create index likes_user_id_idx on likes(user_id);
create index comments_post_id_idx on comments(post_id);
create index comments_user_id_idx on comments(user_id);
create index comments_created_at_idx on comments(created_at desc);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;
alter table posts enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

create policy "Posts are viewable by everyone."
  on posts for select
  using ( true );

create policy "Users can insert their own posts."
  on posts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own posts."
  on posts for update
  using ( auth.uid() = user_id );

create policy "Users can delete own posts."
  on posts for delete
  using ( auth.uid() = user_id );

create policy "Likes are viewable by everyone."
  on likes for select
  using ( true );

create policy "Users can insert their own likes."
  on likes for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own likes."
  on likes for delete
  using ( auth.uid() = user_id );

create policy "Comments are viewable by everyone."
  on comments for select
  using ( true );

create policy "Users can insert their own comments."
  on comments for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own comments."
  on comments for update
  using ( auth.uid() = user_id );

create policy "Users can delete own comments."
  on comments for delete
  using ( auth.uid() = user_id );

-- Function to handle user creation
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

-- Function to handle post likes
create function handle_post_like()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update posts
    set likes_count = likes_count + 1
    where id = NEW.post_id;
  elsif (TG_OP = 'DELETE') then
    update posts
    set likes_count = likes_count - 1
    where id = OLD.post_id;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Function to handle comments count
create function handle_comment_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update posts
    set comments_count = comments_count + 1
    where id = NEW.post_id;
  elsif (TG_OP = 'DELETE') then
    update posts
    set comments_count = comments_count - 1
    where id = OLD.post_id;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Triggers
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create trigger on_like_change
  after insert or delete on likes
  for each row execute procedure handle_post_like();

create trigger on_comment_change
  after insert or delete on comments
  for each row execute procedure handle_comment_count(); 
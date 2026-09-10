Cách tạo Git Submodule

# Bước 1

Có repo cha

# Bước 2 : Thêm submodule

<pre><code> git submodule add https://github.com/alinguyen197/STUDY-authen_author_fe frontend </code></pre>

# Bước 3: cách pull về

git clone https://github.com/alinguyen197/STUDY-authen_author_fullstack

### Lệnh update --init --recursive sẽ tự động clone các repo con về.

<pre><code> git submodule update --init --recursive </code></pre>

# Bước 4 : làm việc với repo con

<pre><code>
cd frontend
git status
git pull
git push
</code></pre>

# Bước 5 : Cập nhật repo con

<pre><code>
cd frontend
git status
git pull
git push
</code></pre>

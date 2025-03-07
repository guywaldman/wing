# User Story 8 - Task List Resource

> **Status**: Work in Progress

It is an early morning in the heart of Tel Aviv, a CEO wakes up and heads out to WayCup, his favorite coffee shop.

He starts his day going over his emails, slack messages, updates from github, etc... But he is struggling. There are
so many things he needs to do, such little time. What would he do? How will he manage all his tasks?

Well... Luckily, he is also an app developer, and when you are a developer everything can be solved with... a new app!

So he spins up VSCode with a file called `task-list.w` and starts writing code in a his new favorite
programming language, Wing!

> Your mission, if you choose to accept it, is to implement the needed pieces of the Wing compile
> for the first iteration of the task list app. This step includes a custom Wing resource that
> represents the task list, and offers an inflight API for editing the list.

```js
bring cloud;

/**
 * Represents a cloud task list.
 */
resource TaskList {
  /** stores the tasks */
  _bucket: cloud.Bucket;
  
  /** used to create a global id */
  _counter: cloud.Counter;

  init() {
    this._bucket = new cloud.Bucket();
    this._counter = new cloud.Counter();
  }

  /** 
   * Adds a task to the task list.
   * @returns The ID of the new task.
   */
  inflight add_task(title: str): str {
    let id = "${this._counter.inc()}";
    print("adding task ${id} with title: ${title}");
    this._bucket.put(id, title);
    return id;
  }

  /** 
   * Gets a task from the task list.
   * @param id - the id of the task to return
   * @returns the title of the task (optimistic)
   */
  inflight get_task(id: str): str {
    return this._bucket.get(id);
  }

  /** 
   * Removes a task from the list
   * @throws Will throw an error if taks with id doesn't exist
   * @param id - the id of the task to be removed
   */
  inflight remove_tasks(id: str) {
    let content = this._bucket.get(id)
    if !content {
      throw("Task with id ${id} doesn't exist");
    }
    
    print("removing task ${id}");
    this._bucket.delete(id);
  }

   /** 
    * Gets the tasks ids 
    * @returns set of task id
    */
  inflight list_task_ids(): Set<str> {
    return this._bucket.list();
  }

   /** 
    * Find tasks with title that contains a term
    * @param term - the term to search
    * @returns set of task id that matches the term
    */
  inflight find_tasks_with(term: str): Set<str> {
    print("find_tasks_with: ${term}");
    let task_ids = this.list_task_ids();
    print("found ${task_ids} tasks");
    let output = new MutSet<str>();
    for id in task_ids {
      let title = this.get_task(id);
      if title.contains(term) {
        print("found task ${id} with title \"${title}\" with term \"${term}\"");
        output.add(id);
      }
    }
    
    print("found ${output.len} tasks which match term '${term}'");
    return output.to_set();
  }
}

// --------------------------------------------
// testing
// --------------------------------------------

let tasks = new TaskList();

let clear_tasks = new cloud.Function(inflight (s: str): str => {
  let results = tasks.list_task_ids();
  let i = 0;
  
  // I hate this code, but wanted to use while here
  while (i < results.len) {
    tasks.remove_tasks(results.at(i));
    i = i + 1;
  }
}) as "utility:clear tasks";

let add_tasks = new cloud.Function(inflight (s: str): str => {
  tasks.add_task("clean the dishes");
  tasks.add_task("buy dishwasher soap");
  tasks.add_task("organize the dishes");
  tasks.add_task("clean the toilet");
  tasks.add_task("clean the kitchen");
}) as "utility:add tasks";

new cloud.Function(inflight (s: str): str => {
  clear_tasks.invoke("");
  add_tasks.invoke("");
  let result = tasks.find_tasks_with("clean the dish");
  assert(result.len == 1);
  assert("clean the dishes".equals(tasks.get_task(result.at(0))));
}) as "test:get and find task";

new cloud.Function(inflight (s: str): str => {
  clear_tasks.invoke("");
  add_tasks.invoke("");
  tasks.remove_tasks(tasks.find_tasks_with("clean the dish").at(0))
  let result = tasks.find_tasks_with("clean the dish");
  assert(result.len == 0);
  assert("clean the dishes".equals(tasks.get_task()));
}) as "test:get, remove and find task";

new cloud.Function(inflight (s: str): str => {
  clear_tasks.invoke("");
  try {
    tasks.remove_tasks("fake-id"); // should throw an exception
    assert(false); // this code should not be reachable 
  } catch (e) {
    assert(true); // redundant, keeping it here to show the intent of the code
  }
}) as "test: deleting an unexisting task should throw an exception";
```

## Wing Console

During the development process of the task list app, our CEO uses Wing Console to test the application locally.

After creating the `task-list.w` file he starts Wing Console by running the following command and continues to 
develop the application side by side with the console:

```sh
wing it ./task-list.w
``` 

While **Wing Console** is running in the background, it watches the .w file src dir for changes, 
recompile the application and updates the view in real time.

In the Console, the developer can see the `TaskList` resource as a box. If he clicks through into
this resource, he can see that it includes a Bucket and a Counter. He can see a number
that represents the current value of the counter (initially 0).

Next to the `TaskList` resource (at the root of the app), we can see the testing `cloud.Function` and
by clicking on the functions, tests are executed and logs and events appear in the event view.
He also sees the bucket fills up with tasks as he iterates.
